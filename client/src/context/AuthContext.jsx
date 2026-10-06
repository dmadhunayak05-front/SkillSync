import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  isFirebaseConfigured, 
  loginWithGoogleFirebase, 
  loginWithEmailFirebase,
  registerWithEmailFirebase,
  sendPasswordResetFirebase,
  logoutFirebase,
  getFirestoreUser,
  setFirestoreUser,
  getFirestoreAllUsers
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Single Source of Authenticated Truth
  const [user, setUser] = useState(null);               // Firebase Auth User (fbUser)
  const [profile, setProfile] = useState(null);         // Firestore profile users/{uid}
  const [currentUser, setCurrentUser] = useState(null); // Direct alias to profile for backward compatibility
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirebaseLive = isFirebaseConfigured();

  // Development Assertion (Section 9): Verify Authenticated Identity Integrity
  useEffect(() => {
    if (user && profile) {
      if (profile.uid !== user.uid) {
        console.error('AUTH IDENTITY MISMATCH', {
          authUid: user.uid,
          profileUid: profile.uid,
          authEmail: user.email,
          profileEmail: profile.email
        });
      }
    }
  }, [user, profile]);

  // Load all other discoverable students from Firestore AND Backend API (Deduplicated by UID)
  const loadAllUsers = async (myUid) => {
    if (!myUid) return [];
    try {
      let remoteUsers = [];
      try {
        remoteUsers = await getFirestoreAllUsers(myUid);
      } catch (e) {}

      let apiUsers = [];
      try {
        apiUsers = await api.getUsers();
      } catch (e) {}

      const userMap = new Map();
      (remoteUsers || []).forEach(u => {
        if (u && u.uid && u.uid !== myUid && !u.uid.startsWith('user_') && !u.isDemo) {
          userMap.set(u.uid, u);
        }
      });
      (apiUsers || []).forEach(u => {
        if (u && u.uid && u.uid !== myUid && !u.uid.startsWith('user_') && !u.isDemo) {
          const existing = userMap.get(u.uid);
          userMap.set(u.uid, { ...existing, ...u });
        }
      });

      const merged = Array.from(userMap.values());
      setAllUsers(merged);
      return merged;
    } catch (err) {
      console.warn('[AuthContext] loadAllUsers error:', err);
      return [];
    }
  };

  // Primary Authentication Listener: Firebase Auth is the Single Source of Truth
  useEffect(() => {
    let unsubscribe = () => {};

    if (isFirebaseLive && auth) {
      // Safety timer: NEVER allow loading screen to hang more than 2.5 seconds
      const safetyTimer = setTimeout(() => {
        setLoading(false);
      }, 2500);

      unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser) => {
          clearTimeout(safetyTimer);
          if (fbUser) {
            setUser(fbUser);

            // 1. Immediately create safe default profile guaranteed to match the authenticated identity
            const defaultUser = {
              uid: fbUser.uid,
              name: fbUser.displayName || 'Student',
              email: fbUser.email,
              photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
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
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            setProfile(defaultUser);
            setCurrentUser(defaultUser);
            setLoading(false); // Unblock UI immediately with genuine identity

            // 2. Load Firestore users/{uid} & backend store without EVER corrupting identity
            try {
              let userProfile = await getFirestoreUser(fbUser.uid);

              if (userProfile) {
                // Identity Protection: If Firestore profile had a corrupted email/identity from a past bug, fix it!
                if (userProfile.email && fbUser.email && userProfile.email.toLowerCase() !== fbUser.email.toLowerCase()) {
                  console.warn('[AuthContext] Correcting corrupted Firestore profile email:', userProfile.email, '->', fbUser.email);
                  userProfile = {
                    ...defaultUser,
                    college: userProfile.college || '',
                    course: userProfile.course || '',
                    skillsToTeach: userProfile.skillsToTeach || [],
                    skillsToLearn: userProfile.skillsToLearn || []
                  };
                }
              } else {
                userProfile = defaultUser;
                await setFirestoreUser(fbUser.uid, userProfile).catch(() => {});
              }

              // Fetch supplementary metadata from backend
              try {
                const backendUser = await api.getUser(fbUser.uid);
                if (backendUser) {
                  // Never overwrite cryptographic name/email from an external or mismatched source
                  const isMatchingIdentity = !backendUser.email || (fbUser.email && backendUser.email.toLowerCase() === fbUser.email.toLowerCase());
                  userProfile = {
                    ...userProfile,
                    college: backendUser.college || userProfile.college,
                    course: backendUser.course || userProfile.course,
                    year: backendUser.year || userProfile.year,
                    bio: backendUser.bio || userProfile.bio,
                    skillsToTeach: backendUser.skillsToTeach?.length ? backendUser.skillsToTeach : userProfile.skillsToTeach,
                    skillsToLearn: backendUser.skillsToLearn?.length ? backendUser.skillsToLearn : userProfile.skillsToLearn,
                    availability: backendUser.availability?.length ? backendUser.availability : userProfile.availability,
                    credits: backendUser.credits ?? userProfile.credits,
                    rating: backendUser.rating ?? userProfile.rating,
                    reviewCount: backendUser.reviewCount ?? userProfile.reviewCount,
                    sessionsCompleted: backendUser.sessionsCompleted ?? userProfile.sessionsCompleted,
                    sessionsTaught: backendUser.sessionsTaught ?? userProfile.sessionsTaught,
                    sessionsLearned: backendUser.sessionsLearned ?? userProfile.sessionsLearned,
                    badges: backendUser.badges?.length ? backendUser.badges : userProfile.badges
                  };
                  if (isMatchingIdentity && backendUser.name && !fbUser.displayName) {
                    userProfile.name = backendUser.name;
                  }
                }
              } catch (beErr) {}

              // Strict Guarantee: Authenticated identity ALWAYS takes precedence
              userProfile.uid = fbUser.uid;
              userProfile.email = fbUser.email;
              if (fbUser.displayName) {
                userProfile.name = fbUser.displayName;
              }
              if (fbUser.photoURL) {
                userProfile.photoURL = fbUser.photoURL;
              }

              setProfile(userProfile);
              setCurrentUser(userProfile);

              // Sync cleaned profile back to Firestore & backend
              setFirestoreUser(fbUser.uid, userProfile).catch(() => {});
              api.syncUser(userProfile).catch(() => {});

              // Load all other discoverable students
              await loadAllUsers(fbUser.uid);
            } catch (profileErr) {
              console.warn('[AuthContext] profile sync warning:', profileErr.message);
              await loadAllUsers(fbUser.uid);
            }
          } else {
            setUser(null);
            setProfile(null);
            setCurrentUser(null);
            setAllUsers([]);
            setLoading(false);
          }
        },
        (authErr) => {
          clearTimeout(safetyTimer);
          console.warn('[AuthContext] onAuthStateChanged error:', authErr);
          setUser(null);
          setProfile(null);
          setCurrentUser(null);
          setLoading(false);
        }
      );
    } else {
      console.warn('[SkillSync Auth] Firebase credentials missing or not configured in client/.env');
      setUser(null);
      setProfile(null);
      setCurrentUser(null);
      setAllUsers([]);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [isFirebaseLive]);

  // Periodic poll to keep all registered users synchronized across active browser sessions
  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(() => {
      loadAllUsers(user.uid);
    }, 4000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // 1. Google Sign-In (Official Firebase GoogleAuthProvider)
  const loginWithGoogle = async () => {
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase Authentication is not configured. Please paste your Firebase web credentials into client/.env.');
    }
    setLoading(true);
    try {
      const fbUser = await loginWithGoogleFirebase();
      return fbUser;
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Sign-In (Validates against Firebase Auth)
  const loginWithEmail = async (email, password) => {
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase Authentication is not configured. Please paste your Firebase web credentials into client/.env.');
    }
    setLoading(true);
    try {
      const fbUser = await loginWithEmailFirebase(email.trim(), password);
      return fbUser;
    } finally {
      setLoading(false);
    }
  };

  // 3. Register New Account (Creates account in Firebase Auth)
  const registerWithEmail = async (email, password, displayName) => {
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase Authentication is not configured. Please paste your Firebase web credentials into client/.env.');
    }
    setLoading(true);
    try {
      const fbUser = await registerWithEmailFirebase(email.trim(), password, displayName?.trim());
      return fbUser;
    } finally {
      setLoading(false);
    }
  };

  // 4. Send Password Reset Email
  const sendPasswordReset = async (email) => {
    if (!isFirebaseLive || !auth) {
      throw new Error('Firebase Authentication is not configured. Please paste your Firebase web credentials into client/.env.');
    }
    await sendPasswordResetFirebase(email.trim());
  };

  // 5. Save / Update User Profile (Firestore: users/{uid} & Backend Store)
  const saveUser = async (updatedData) => {
    if (!updatedData?.uid) return;

    // Strict Security Constraint: A user may ONLY save their own profile!
    if (!user?.uid || updatedData.uid !== user.uid) {
      console.warn('[AuthContext] Blocked attempt to call saveUser for non-current user:', updatedData?.uid, 'current:', user?.uid);
      return;
    }

    const safeData = {
      ...currentUser,
      ...updatedData,
      uid: user.uid,
      email: user.email,
      name: updatedData.name || user.displayName || currentUser?.name || 'Student',
      photoURL: user.photoURL || updatedData.photoURL || currentUser?.photoURL,
      updatedAt: new Date().toISOString()
    };

    setProfile(safeData);
    setCurrentUser(safeData);

    setAllUsers(prev => {
      const idx = prev.findIndex(u => u.uid === safeData.uid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...safeData };
        return next;
      }
      return prev;
    });

    if (isFirebaseLive) {
      setFirestoreUser(safeData.uid, safeData).catch(() => {});
    }
    await api.syncUser(safeData).catch(() => {});
    loadAllUsers(user.uid);
  };

  const updateProfile = (data) => {
    if (!user?.uid) return;
    saveUser({ ...currentUser, ...data });
  };

  // 6. Sign Out
  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseLive) {
        await logoutFirebase();
      }
    } catch (e) {
      console.warn('[AuthContext] Logout error:', e);
    } finally {
      setUser(null);
      setProfile(null);
      setCurrentUser(null);
      setAllUsers([]);
      setLoading(false);
    }
  };

  const isProfileComplete = (targetUser = currentUser) => {
    if (!targetUser) return false;
    return Boolean(
      targetUser.name && 
      targetUser.skillsToTeach?.length > 0 && 
      targetUser.skillsToLearn?.length > 0
    );
  };

  const refreshUsers = () => {
    if (user?.uid) {
      return loadAllUsers(user.uid);
    }
    return Promise.resolve([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      currentUser,
      allUsers,
      loading,
      isFirebaseLive,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      sendPasswordReset,
      updateProfile,
      saveUser,
      logout,
      isProfileComplete,
      refreshUsers
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
