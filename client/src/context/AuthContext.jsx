import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEMO_USERS } from '../data/mockData';
import { 
  auth, 
  isFirebaseConfigured, 
  loginWithGoogleFirebase, 
  loginWithEmailFirebase,
  registerWithEmailFirebase,
  logoutFirebase,
  getFirestoreUser,
  setFirestoreUser,
  getFirestoreAllUsers,
  seedFirestoreProfilesIfEmpty
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../services/api';

const AuthContext = createContext(null);

// Tab/Window-isolated session storage key so Tab 1 and Tab 2 can be two different users
const SESSION_AUTH_KEY = 'skillsync_session_user';
const GLOBAL_USERS_KEY = 'skillsync_global_student_directory';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState(() => {
    const saved = localStorage.getItem(GLOBAL_USERS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEMO_USERS;
  });
  const [loading, setLoading] = useState(true);
  const isFirebaseLive = isFirebaseConfigured();

  // Save global student directory
  useEffect(() => {
    localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(allUsers));
  }, [allUsers]);

  // Initial Auth Check: Listen to Firebase Auth or restore isolated window session
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseLive && auth) {
      // Seed Firestore with discoverable demo students if first time
      seedFirestoreProfilesIfEmpty(DEMO_USERS);

      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // Fetch or initialize user document from Firestore users/{uid}
          let userProfile = await getFirestoreUser(fbUser.uid);
          if (!userProfile) {
            userProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Student',
              email: fbUser.email,
              photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
              college: '',
              course: '',
              year: '2nd Year',
              bio: '',
              skillsToTeach: [],
              skillsToLearn: [],
              interests: [],
              availability: [],
              credits: 50,
              rating: 5.0,
              reviewCount: 0,
              sessionsCompleted: 0,
              sessionsTaught: 0,
              sessionsLearned: 0,
              badges: ['New Explorer'],
              createdAt: new Date().toISOString()
            };
            await setFirestoreUser(fbUser.uid, userProfile);
          }
          setCurrentUser(userProfile);
          sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(userProfile));

          // Fetch other users for discovery
          const remoteUsers = await getFirestoreAllUsers(fbUser.uid);
          if (remoteUsers.length > 0) {
            setAllUsers(prev => {
              const map = new Map(prev.map(u => [u.uid, u]));
              remoteUsers.forEach(u => map.set(u.uid, u));
              return Array.from(map.values());
            });
          }
        } else {
          setCurrentUser(null);
          sessionStorage.removeItem(SESSION_AUTH_KEY);
        }
        setLoading(false);
      });
    } else {
      // Isolated session restoration (e.g. Tab 1 is Manideep, Tab 2 is Rahul)
      const sessionUserStr = sessionStorage.getItem(SESSION_AUTH_KEY);
      if (sessionUserStr) {
        try {
          const parsed = JSON.parse(sessionUserStr);
          setCurrentUser(parsed);
        } catch (e) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, [isFirebaseLive]);

  // 1. Google Sign-In
  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseLive) {
        const fbUser = await loginWithGoogleFirebase();
        return fbUser;
        throw new Error('Google Sign-In requires Firebase configuration in client/.env. Please configure Firebase API keys or use Email Sign-In.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Sign-In (Allows testing multiple users simultaneously in separate windows!)
  const loginWithEmail = async (email, password, displayName = null) => {
    setLoading(true);
    try {
      if (isFirebaseLive) {
        const fbUser = await loginWithEmailFirebase(email, password);
        return fbUser;
      } else {
        // Locate matching account in student directory or create one with deterministic UID
        const normalized = email.toLowerCase().trim();
        let existing = allUsers.find(u => u.email?.toLowerCase() === normalized);

        if (!existing) {
          const generatedUid = 'uid_' + normalized.replace(/[^a-z0-9]/g, '_');
          existing = {
            uid: generatedUid,
            name: displayName || email.split('@')[0],
            email: normalized,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${generatedUid}`,
            college: 'Tech University',
            course: 'Computer Science',
            year: '2nd Year',
            bio: 'Student on SkillSync.',
            skillsToTeach: ['Web Development'],
            skillsToLearn: ['Python'],
            interests: ['Technology'],
            availability: ['Monday 5 PM - 8 PM'],
            credits: 50,
            rating: 5.0,
            reviewCount: 0,
            sessionsCompleted: 0,
            sessionsTaught: 0,
            sessionsLearned: 0,
            badges: ['New Explorer'],
            createdAt: new Date().toISOString()
          };
          saveUser(existing);
        }

        setCurrentUser(existing);
        sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(existing));
        return existing;
      }
    } catch (err) {
      console.error('Email login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Register New Account
  const registerWithEmail = async (email, password, displayName) => {
    setLoading(true);
    try {
      if (isFirebaseLive) {
        const fbUser = await registerWithEmailFirebase(email, password, displayName);
        return fbUser;
      } else {
        const normalized = email.toLowerCase().trim();
        const generatedUid = 'uid_' + Date.now().toString(36);
        const newAccount = {
          uid: generatedUid,
          name: displayName || 'Student',
          email: normalized,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${generatedUid}`,
          college: '',
          course: '',
          year: '1st Year',
          bio: '',
          skillsToTeach: [],
          skillsToLearn: [],
          interests: [],
          availability: [],
          credits: 50,
          rating: 5.0,
          reviewCount: 0,
          sessionsCompleted: 0,
          sessionsTaught: 0,
          sessionsLearned: 0,
          badges: ['New Explorer'],
          createdAt: new Date().toISOString()
        };

        saveUser(newAccount);
        setCurrentUser(newAccount);
        sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(newAccount));
        return newAccount;
      }
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 4. Save User Profile Document
  const saveUser = (updatedData) => {
    setAllUsers(prev => {
      const idx = prev.findIndex(u => u.uid === updatedData.uid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...updatedData };
        return next;
      }
      return [...prev, updatedData];
    });

    if (currentUser?.uid === updatedData.uid) {
      const updated = { ...currentUser, ...updatedData };
      setCurrentUser(updated);
      sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(updated));
    }

    if (isFirebaseLive) {
      setFirestoreUser(updatedData.uid, updatedData);
    }
    api.syncUser(updatedData).catch(() => {});
  };

  const updateProfile = (data) => {
    if (!currentUser) return;
    saveUser({ ...currentUser, ...data });
  };

  // 5. Sign Out
  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseLive) {
        await logoutFirebase();
      }
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setCurrentUser(null);
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      setLoading(false);
    }
  };

  const isProfileComplete = (user = currentUser) => {
    if (!user) return false;
    return Boolean(
      user.name && 
      user.skillsToTeach?.length > 0 && 
      user.skillsToLearn?.length > 0
    );
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      allUsers,
      loading,
      isFirebaseLive,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      updateProfile,
      saveUser,
      logout,
      isProfileComplete
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
