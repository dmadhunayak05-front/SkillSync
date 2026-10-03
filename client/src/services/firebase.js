import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.projectId && 
    !firebaseConfig.apiKey.includes('your_') &&
    firebaseConfig.apiKey.length > 10
  );
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured()) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
  }
}

export { auth, db, googleProvider };

// ---------------- AUTHENTICATION METHODS ----------------

/**
 * Sign in using Google Sign-In popup
 */
export async function loginWithGoogleFirebase() {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials not configured in .env');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in using Email and Password
 */
export async function loginWithEmailFirebase(email, password) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials not configured in .env');
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Register a new student account using Email and Password
 */
export async function registerWithEmailFirebase(email, password, displayName) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase credentials not configured in .env');
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateAuthProfile(result.user, { displayName });
  }
  return result.user;
}

/**
 * Sign out of Firebase
 */
export async function logoutFirebase() {
  if (auth) {
    await fbSignOut(auth);
  }
}

// ---------------- FIRESTORE DATA METHODS ----------------

/**
 * Fetch a single user profile from users/{uid}
 */
export async function getFirestoreUser(uid) {
  if (!db || !uid) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (e) {
    console.warn('[Firestore] Error getting user doc:', e);
    return null;
  }
}

/**
 * Create or update users/{uid}
 */
export async function setFirestoreUser(uid, data) {
  if (!db || !uid) return;
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[Firestore] Error setting user doc:', e);
  }
}

/**
 * Fetch all discoverable students from Firestore
 */
export async function getFirestoreAllUsers(currentUid) {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list = [];
    snap.forEach(docSnap => {
      const u = docSnap.data();
      if (u.uid !== currentUid) {
        list.push(u);
      }
    });
    return list;
  } catch (e) {
    console.warn('[Firestore] Error fetching users list:', e);
    return [];
  }
}

/**
 * Seed discoverable student profiles (Rahul, Ananya, Arjun, Priya) into Firestore if empty
 */
export async function seedFirestoreProfilesIfEmpty(seedList) {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (snap.empty) {
      console.log('[Firestore] Seeding initial discoverable student profiles...');
      for (const student of seedList) {
        await setDoc(doc(db, 'users', student.uid), {
          ...student,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (e) {
    console.warn('[Firestore] Error seeding initial profiles:', e);
  }
}

/**
 * Real-time listener for user's connection requests (incoming & outgoing)
 * Path: connectionRequests/{requestId}
 * 
 * Complies strictly with security rules and query constraints:
 * - Received requests: where('receiverId', '==', uid)
 * - Sent requests: where('senderId', '==', uid)
 */
export function listenToFirestoreRequests(uid, onUpdate) {
  if (!db || !uid) return () => {};

  console.log('=== [FIRESTORE: INITIALIZING REQUEST LISTENERS] ===');
  console.log('Current authenticated UID:', auth?.currentUser?.uid || uid);
  console.log('Listener UID parameter:', uid);
  console.log('Received request query:', 'collection(db, "connectionRequests"), where("receiverId", "==", uid)');
  console.log('Query receiverId:', uid);
  console.log('Sent request query:', 'collection(db, "connectionRequests"), where("senderId", "==", uid)');
  console.log('Query senderId:', uid);
  console.log('===================================================');

  const qReceived = query(
    collection(db, 'connectionRequests'),
    where('receiverId', '==', uid)
  );

  const qSent = query(
    collection(db, 'connectionRequests'),
    where('senderId', '==', uid)
  );

  let receivedList = [];
  let sentList = [];

  const notifyMerged = () => {
    const map = new Map();
    receivedList.forEach(r => map.set(r.id, r));
    sentList.forEach(r => map.set(r.id, r));
    const merged = Array.from(map.values()).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    onUpdate(merged);
  };

  const unsubReceived = onSnapshot(qReceived, (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    receivedList = list;

    const pendingReceived = list.filter(r => r.status === 'pending');
    console.log('=== [DEV LOG: RECEIVED REQUESTS SNAPSHOT] ===');
    console.log('Current authenticated UID:', auth?.currentUser?.uid || uid);
    console.log('Received request query:', 'where("receiverId", "==", currentUser.uid)');
    console.log('Query receiverId:', uid);
    console.log('Number of received requests (total):', list.length);
    console.log('Number of received requests (pending):', pendingReceived.length);
    list.forEach((req, idx) => {
      console.log(`[Request #${idx + 1}] ID: ${req.id} | senderId: ${req.senderId} | receiverId: ${req.receiverId} | status: ${req.status}`);
    });
    console.log('=============================================');

    notifyMerged();
  }, (err) => {
    console.warn('[Firestore] Received requests listener error:', err.message);
  });

  const unsubSent = onSnapshot(qSent, (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    sentList = list;
    notifyMerged();
  }, (err) => {
    console.warn('[Firestore] Sent requests listener error:', err.message);
  });

  return () => {
    unsubReceived();
    unsubSent();
  };
}

/**
 * Real-time listener specifically for user's pending received requests
 * Conceptually: where("receiverId", "==", currentUser.uid) AND where("status", "==", "pending")
 */
export function listenToFirestoreReceivedRequests(uid, onUpdate) {
  if (!db || !uid) return () => {};

  console.log('=== [DEV LOG: RECEIVED REQUESTS QUERY INITIATED] ===');
  console.log('Current authenticated UID:', auth?.currentUser?.uid || uid);
  console.log('Received request query: collection(db, "connectionRequests"), where("receiverId", "==", uid), where("status", "==", "pending")');
  console.log('Query receiverId:', uid);
  console.log('====================================================');

  const q = query(
    collection(db, 'connectionRequests'),
    where('receiverId', '==', uid),
    where('status', '==', 'pending')
  );

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });

    console.log('=== [DEV LOG: RECEIVED REQUESTS RESULT] ===');
    console.log('Current authenticated UID:', auth?.currentUser?.uid || uid);
    console.log('Query receiverId:', uid);
    console.log('Number of received requests:', list.length);
    list.forEach((req, idx) => {
      console.log(`  [${idx + 1}] senderId: ${req.senderId} | receiverId: ${req.receiverId} | status: ${req.status}`);
    });
    console.log('===========================================');

    onUpdate(list);
  }, (err) => {
    console.warn('[Firestore] Pending received requests listener error:', err.message);
  });
}

/**
 * Real-time listener for user's active connections
 */
export function listenToFirestoreConnections(uid, onUpdate) {
  if (!db || !uid) return () => {};
  
  const q = query(
    collection(db, 'connections'),
    where('userIds', 'array-contains', uid)
  );

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, (err) => console.warn('[Firestore] Connections listener error:', err));
}

/**
 * Real-time listener for connection chat messages
 */
export function listenToFirestoreMessages(connectionId, onUpdate) {
  if (!db || !connectionId) return () => {};
  
  const q = query(
    collection(db, 'connections', connectionId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(list);
  }, (err) => console.warn('[Firestore] Messages listener error:', err));
}

/**
 * Send real Firestore connection request
 * Path: connectionRequests/{requestId}
 */
export async function sendFirestoreConnectionRequest(requestData) {
  if (!db) return;
  try {
    const docRef = doc(db, 'connectionRequests', requestData.id);

    console.log('=== [DEV LOG: SENDING CONNECTION REQUEST] ===');
    console.log('Current authenticated UID:', auth?.currentUser?.uid);
    console.log('Sender UID:', requestData.senderId);
    console.log('Receiver UID:', requestData.receiverId);
    console.log('Sender name:', requestData.senderName || requestData.sender?.name || 'Unknown');
    console.log('Receiver name:', requestData.receiverName || requestData.receiver?.name || 'Unknown');
    console.log('Request document ID:', requestData.id);
    console.log('Firestore collection/path:', `connectionRequests/${requestData.id}`);
    console.log('Request status:', requestData.status || 'pending');
    console.log('=============================================');

    await setDoc(docRef, {
      id: requestData.id,
      senderId: requestData.senderId,
      receiverId: requestData.receiverId,
      senderName: requestData.senderName || requestData.sender?.name || '',
      senderPhotoURL: requestData.senderPhotoURL || requestData.sender?.photoURL || '',
      senderCollege: requestData.senderCollege || requestData.sender?.college || '',
      receiverName: requestData.receiverName || requestData.receiver?.name || '',
      skillOffered: requestData.skillOffered || 'Knowledge Exchange',
      skillRequested: requestData.skillRequested || 'Skill Mentorship',
      message: requestData.message || "I'd love to connect and exchange skills.",
      status: requestData.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('[Firestore] Successfully created connectionRequest doc:', requestData.id);
  } catch (err) {
    console.error('[Firestore] Error creating connection request:', err);
    throw err;
  }
}

/**
 * Update connection request status
 */
export async function updateFirestoreConnectionRequest(requestId, status) {
  if (!db || !requestId) return;
  try {
    const docRef = doc(db, 'connectionRequests', requestId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    console.log(`[Firestore] Connection request ${requestId} updated to status: ${status}`);
  } catch (err) {
    console.error('[Firestore] Error updating connection request:', err);
    throw err;
  }
}

/**
 * Create connection document
 * Path: connections/{connectionId}
 */
export async function createFirestoreConnection(connectionData) {
  if (!db) return;
  try {
    const docRef = doc(db, 'connections', connectionData.id);
    await setDoc(docRef, {
      ...connectionData,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('[Firestore] Error creating connection:', err);
  }
}

/**
 * Send message to Firestore connection
 * Path: connections/{connectionId}/messages/{messageId}
 */
export async function sendFirestoreMessage(connectionId, messageData) {
  if (!db || !connectionId) return;
  try {
    const docRef = doc(db, 'connections', connectionId, 'messages', messageData.id);
    await setDoc(docRef, {
      ...messageData,
      createdAt: serverTimestamp()
    });

    // Also update lastMessage on connection document
    const connRef = doc(db, 'connections', connectionId);
    await updateDoc(connRef, {
      lastMessage: messageData.text,
      lastMessageAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('[Firestore] Error sending message:', err);
  }
}

/**
 * Create genuine session in Firestore
 * Path: sessions/{sessionId}
 * 
 * Schema:
 * {
 *   learnerId: "...",
 *   teacherId: "...",
 *   skill: "...",
 *   scheduledAt: "...",
 *   status: "scheduled",
 *   meeting: {
 *     provider: "google_meet",
 *     spaceName: "...",
 *     meetingUri: "REAL URI RETURNED BY GOOGLE"
 *   },
 *   createdAt: ...
 * }
 */
export async function createFirestoreSession(sessionData) {
  if (!db || !sessionData?.id) return;
  try {
    const docRef = doc(db, 'sessions', sessionData.id);
    await setDoc(docRef, {
      ...sessionData,
      createdAt: serverTimestamp()
    });
    console.log('[Firestore] Session document written successfully:', sessionData.id);
  } catch (err) {
    console.warn('[Firestore] Error creating session:', err);
  }
}

/**
 * Update session status / data in Firestore
 */
export async function updateFirestoreSession(sessionId, updates) {
  if (!db || !sessionId) return;
  try {
    const docRef = doc(db, 'sessions', sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('[Firestore] Error updating session:', err);
  }
}

/**
 * Real-time listener for user's scheduled & active sessions
 */
export function listenToFirestoreSessions(uid, onUpdate) {
  if (!db || !uid) return () => {};

  // Listen to sessions where user is either learner or teacher
  const qLearner = query(collection(db, 'sessions'), where('learnerId', '==', uid));
  const qTeacher = query(collection(db, 'sessions'), where('teacherId', '==', uid));

  let learnerSessions = [];
  let teacherSessions = [];

  const mergeAndNotify = () => {
    const map = new Map();
    [...learnerSessions, ...teacherSessions].forEach(s => map.set(s.id, s));
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );
    onUpdate(merged);
  };

  const unsub1 = onSnapshot(qLearner, (snapshot) => {
    learnerSessions = [];
    snapshot.forEach(doc => learnerSessions.push({ id: doc.id, ...doc.data() }));
    mergeAndNotify();
  }, (err) => console.warn('[Firestore] Learner sessions listener error:', err));

  const unsub2 = onSnapshot(qTeacher, (snapshot) => {
    teacherSessions = [];
    snapshot.forEach(doc => teacherSessions.push({ id: doc.id, ...doc.data() }));
    mergeAndNotify();
  }, (err) => console.warn('[Firestore] Teacher sessions listener error:', err));

  return () => {
    unsub1();
    unsub2();
  };
}

/**
 * Save session feedback to Firestore
 * Path: feedback/{feedbackId}
 */
export async function createFirestoreFeedback(feedbackData) {
  if (!db || !feedbackData?.id) return;
  try {
    const docRef = doc(db, 'feedback', feedbackData.id);
    await setDoc(docRef, {
      ...feedbackData,
      createdAt: serverTimestamp()
    });
    console.log('[Firestore] Feedback document written successfully:', feedbackData.id);
  } catch (err) {
    console.warn('[Firestore] Error saving feedback:', err);
  }
}

/**
 * Real-time listener for user's received feedback
 */
export function listenToFirestoreFeedback(uid, onUpdate) {
  if (!db || !uid) return () => {};

  const q = query(collection(db, 'feedback'), where('revieweeId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const list = [];
    snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    onUpdate(list);
  }, (err) => console.warn('[Firestore] Feedback listener error:', err));
}

