import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { 
  sendFirestoreConnectionRequest, 
  updateFirestoreConnectionRequest, 
  createFirestoreConnection, 
  sendFirestoreMessage,
  listenToFirestoreRequests,
  listenToFirestoreConnections,
  createFirestoreSession,
  updateFirestoreSession,
  listenToFirestoreSessions,
  createFirestoreFeedback,
  listenToFirestoreFeedback
} from '../services/firebase';
import confetti from 'canvas-confetti';

const SyncContext = createContext(null);

const STORAGE_REQUESTS = 'skillsync_requests';
const STORAGE_CONNECTIONS = 'skillsync_connections';
const STORAGE_MESSAGES = 'skillsync_messages';
const STORAGE_SESSIONS = 'skillsync_sessions';
const STORAGE_FEEDBACK = 'skillsync_feedback';
const STORAGE_NOTIFS = 'skillsync_notifications';

export function SyncProvider({ children }) {
  const { currentUser, allUsers, saveUser, isFirebaseLive } = useAuth();

  // Multi-tab broadcast channel for instantaneous zero-latency updates across browser tabs
  const [broadcast, setBroadcast] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      const bc = new BroadcastChannel('skillsync_realtime_sync');
      setBroadcast(bc);
      return () => bc.close();
    }
  }, []);

  // 1. Connection Requests (Source of truth: Firestore)
  const [requests, setRequests] = useState([]);

  // 2. Active Connections (Source of truth: Firestore)
  const [connections, setConnections] = useState([]);

  // 3. Chat Messages map: { [connectionId]: Array<Message> }
  const [messages, setMessages] = useState({});

  // 4. Scheduled Sessions (Source of truth: Firestore)
  const [sessions, setSessions] = useState([]);

  // 5. Feedback items (Source of truth: Firestore)
  const [feedback, setFeedback] = useState([]);

  // 6. Notifications
  const [notifications, setNotifications] = useState([]);

  // Clear or initialize user-specific real-time Firestore listeners
  useEffect(() => {
    if (!currentUser?.uid) {
      setRequests([]);
      setConnections([]);
      setSessions([]);
      setFeedback([]);
      return;
    }

    if (isFirebaseLive) {
      console.log('[SyncContext] Subscribing to real-time Firestore listeners for UID:', currentUser.uid);

      const unsubReq = listenToFirestoreRequests(currentUser.uid, (remoteRequests) => {
        setRequests(remoteRequests || []);
      });

      const unsubConn = listenToFirestoreConnections(currentUser.uid, (remoteConns) => {
        setConnections(remoteConns || []);
      });

      const unsubSessions = listenToFirestoreSessions(currentUser.uid, (remoteSessions) => {
        setSessions(remoteSessions || []);
      });

      const unsubFeedback = listenToFirestoreFeedback(currentUser.uid, (remoteFeedback) => {
        setFeedback(remoteFeedback || []);
      });

      return () => {
        unsubReq();
        unsubConn();
        unsubSessions();
        unsubFeedback();
      };
    } else {
      // Backend polling fallback for multi-browser sync when live Firebase credentials are not yet entered in .env
      const syncFromBackend = async () => {
        try {
          const [reqs, conns, sess] = await Promise.all([
            api.getConnectionRequests(currentUser.uid),
            api.getConnections(currentUser.uid),
            api.getSessions(currentUser.uid)
          ]);
          if (Array.isArray(reqs)) setRequests(reqs);
          if (Array.isArray(conns)) setConnections(conns);
          if (Array.isArray(sess)) setSessions(sess);
        } catch (e) {
          // silently handle
        }
      };
      syncFromBackend();
      const interval = setInterval(syncFromBackend, 2500);
      return () => clearInterval(interval);
    }
  }, [currentUser?.uid, isFirebaseLive]);

  // Handle incoming broadcast messages from other tabs / windows
  useEffect(() => {
    if (!broadcast) return;
    const handleMsg = (e) => {
      const { type, payload } = e.data || {};
      if (type === 'NEW_MESSAGE') {
        setMessages(prev => ({
          ...prev,
          [payload.connectionId]: [...(prev[payload.connectionId] || []), payload.message]
        }));
      } else if (type === 'NEW_REQUEST') {
        setRequests(prev => {
          if (prev.some(r => r.id === payload.id)) return prev;
          return [payload, ...prev];
        });
      } else if (type === 'REQUEST_RESPONDED') {
        setRequests(prev => prev.map(r => r.id === payload.requestId ? { ...r, status: payload.action } : r));
        if (payload.action === 'accepted' && payload.connection) {
          setConnections(prev => {
            if (prev.some(c => c.id === payload.connection.id)) return prev;
            return [payload.connection, ...prev];
          });
        }
      } else if (type === 'NEW_SESSION') {
        setSessions(prev => [payload, ...prev]);
      } else if (type === 'SESSION_COMPLETED') {
        setSessions(prev => prev.map(s => s.id === payload.sessionId ? { ...s, status: 'completed' } : s));
      } else if (type === 'NEW_FEEDBACK') {
        setFeedback(prev => [payload, ...prev]);
      } else if (type === 'NEW_NOTIFICATION') {
        setNotifications(prev => [payload, ...prev]);
      }
    };
    broadcast.addEventListener('message', handleMsg);
    return () => broadcast.removeEventListener('message', handleMsg);
  }, [broadcast]);

  // Trigger Notification Helper
  const notifyUser = useCallback((userId, title, message, link, type = 'info') => {
    const notif = {
      id: 'notif_' + Date.now().toString(36),
      userId,
      title,
      message,
      link,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
    broadcast?.postMessage({ type: 'NEW_NOTIFICATION', payload: notif });
  }, [broadcast]);

  // Actions
  // 1. Send Real Connection Request
  const sendConnectionRequest = async ({ receiverId, message, skillOffered, skillRequested }) => {
    if (!currentUser?.uid) throw new Error('Must be logged in to send a request');
    if (!receiverId) throw new Error('Recipient user ID is missing');
    
    // Check if request or connection exists
    const existingReq = requests.find(r => 
      r.senderId === currentUser.uid && r.receiverId === receiverId && r.status === 'pending'
    );
    if (existingReq) throw new Error('A request to this student is already pending!');

    const existingConn = connections.find(c => 
      c.userIds && c.userIds.includes(currentUser.uid) && c.userIds.includes(receiverId)
    );
    if (existingConn) throw new Error('You are already connected with this student!');

    const requestId = 'req_' + Date.now().toString(36);
    const targetUser = allUsers.find(u => u.uid === receiverId);

    const newReq = {
      id: requestId,
      senderId: currentUser.uid,
      receiverId: receiverId,
      senderName: currentUser.name || currentUser.displayName || 'Student',
      senderPhotoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
      senderCollege: currentUser.college || '',
      receiverName: targetUser?.name || 'Student',
      message: message || "I'd love to connect and exchange skills.",
      skillOffered: skillOffered || currentUser.skillsToTeach?.[0] || 'General Knowledge',
      skillRequested: skillRequested || targetUser?.skillsToTeach?.[0] || 'Skill Mentorship',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Temporary development logging (Part 2)
    console.log('=== [DEV LOG: CONNECTION REQUEST SENT] ===');
    console.log('Current authenticated UID:', currentUser.uid);
    console.log('Sender UID:', currentUser.uid);
    console.log('Receiver UID:', receiverId);
    console.log('Sender name:', newReq.senderName);
    console.log('Receiver name:', newReq.receiverName);
    console.log('Request document ID:', requestId);
    console.log('Firestore collection/path:', `connectionRequests/${requestId}`);
    console.log('Request status:', 'pending');
    console.log('==========================================');

    setRequests(prev => [newReq, ...prev.filter(r => r.id !== newReq.id)]);
    broadcast?.postMessage({ type: 'NEW_REQUEST', payload: newReq });

    // Send notification to receiver
    notifyUser(
      receiverId,
      'New Learning Request',
      `${currentUser.name} wants to connect with you to learn ${newReq.skillRequested}!`,
      '/connections',
      'connection_request'
    );

    // Save to Firestore as single source of truth
    if (isFirebaseLive) {
      await sendFirestoreConnectionRequest(newReq);
    }

    // Try backend call as well for multi-browser sync
    api.sendConnectionRequest(newReq).catch(() => {});

    return newReq;
  };

  // 2. Respond to Connection Request (Accept / Decline)
  const respondToConnectionRequest = async (requestId, action) => {
    if (!currentUser?.uid) return;
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    // Part 6 & 7: Verify request belongs to currentUser.uid
    if (req.receiverId !== currentUser.uid) {
      console.warn('[Security] Unauthorized: Cannot respond to request not addressed to you');
      throw new Error('Unauthorized: This request is not addressed to you.');
    }

    if (action === 'accepted') {
      const connId = `conn_${req.senderId}_${req.receiverId}`;
      const createdConn = {
        id: connId,
        userIds: [req.senderId, req.receiverId],
        requestId: req.id,
        createdAt: new Date().toISOString(),
        lastMessage: 'Connected! Say hello and schedule your first session.',
        lastMessageAt: new Date().toISOString()
      };

      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r));
      setConnections(prev => [createdConn, ...prev.filter(c => c.id !== connId)]);

      // Initial chat message
      const welcomeMsg = {
        id: 'msg_welcome_' + Date.now().toString(36),
        connectionId: connId,
        senderId: currentUser.uid,
        text: `Hey! I've accepted your learning request. Excited to learn and share together!`,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => ({
        ...prev,
        [connId]: [...(prev[connId] || []), welcomeMsg]
      }));

      // Notify the requester
      notifyUser(
        req.senderId,
        'Connection Accepted!',
        `${currentUser.name} accepted your learning request. Open chat to say hello!`,
        `/chat/${connId}`,
        'connection_accepted'
      );

      broadcast?.postMessage({
        type: 'REQUEST_RESPONDED',
        payload: { requestId, action: 'accepted', connection: createdConn }
      });

      if (isFirebaseLive) {
        await updateFirestoreConnectionRequest(requestId, 'accepted');
        await createFirestoreConnection(createdConn);
      }

      api.respondToConnectionRequest(requestId, 'accepted').catch(() => {});
    } else if (action === 'rejected') {
      // Part 7: When User B rejects, status = "rejected", request disappears from Received Requests
      setRequests(prev => prev.filter(r => r.id !== requestId));

      broadcast?.postMessage({
        type: 'REQUEST_RESPONDED',
        payload: { requestId, action: 'rejected' }
      });

      if (isFirebaseLive) {
        await updateFirestoreConnectionRequest(requestId, 'rejected');
      }

      api.respondToConnectionRequest(requestId, 'rejected').catch(() => {});
    }
  };

  // 3. Send Real-Time Chat Message
  const sendMessage = async (connectionId, text) => {
    if (!currentUser || !text.trim()) return;

    const message = {
      id: 'msg_' + Date.now().toString(36),
      connectionId,
      senderId: currentUser.uid,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => ({
      ...prev,
      [connectionId]: [...(prev[connectionId] || []), message]
    }));

    setConnections(prev => prev.map(c => {
      if (c.id === connectionId) {
        return { ...c, lastMessage: text.trim(), lastMessageAt: message.createdAt };
      }
      return c;
    }));

    broadcast?.postMessage({
      type: 'NEW_MESSAGE',
      payload: { connectionId, message }
    });

    // Notify other participant
    const conn = connections.find(c => c.id === connectionId);
    if (conn) {
      const otherId = conn.userIds.find(id => id !== currentUser.uid);
      if (otherId) {
        notifyUser(
          otherId,
          `New message from ${currentUser.name}`,
          text.length > 50 ? text.substring(0, 50) + '...' : text,
          `/chat/${connectionId}`,
          'chat_message'
        );
      }
    }

    if (isFirebaseLive) {
      sendFirestoreMessage(connectionId, message).catch(() => {});
    }

    api.sendMessage(connectionId, { senderId: currentUser.uid, text }).catch(() => {});

    return message;
  };

  // 4. Schedule Learning Session with REAL Google Meet
  const scheduleSession = async ({
    title,
    skill,
    peerId,
    scheduledAt,
    duration = 45,
    agenda = []
  }) => {
    if (!currentUser?.uid) throw new Error('Must be logged in');

    const teacher = allUsers.find(u => u.uid === peerId);

    // Call SkillSync backend to create a REAL Google Meet space via Google's official API
    // NO fake or random codes. The exact URI returned by Google is our single source of truth.
    const res = await api.createGoogleMeet({
      title: title || `${skill} Peer Learning Session`,
      scheduledAt,
      durationMinutes: Number(duration),
      teacherEmail: teacher?.email,
      learnerEmail: currentUser.email,
      userId: currentUser.uid,
      teacherId: peerId,
      learnerId: currentUser.uid
    });

    const realMeetingUri = res.meeting?.meetingUri || res.meetingUri;
    const realSpaceName = res.meeting?.spaceName || res.spaceName || '';
    const realMeetingCode = res.meetingCode || realMeetingUri?.replace('https://meet.google.com/', '') || '';

    const sessionId = 'session_' + Date.now().toString(36);
    const newSession = {
      id: sessionId,
      title: title || `${skill} Peer Learning Session`,
      skill,
      learnerId: currentUser.uid,
      teacherId: peerId,
      scheduledAt,
      duration: Number(duration),
      durationMinutes: Number(duration),
      status: 'scheduled',
      meeting: {
        provider: 'google_meet',
        spaceName: realSpaceName,
        meetingUri: realMeetingUri // EXACT URI RETURNED BY GOOGLE
      },
      meetingUri: realMeetingUri,
      meetingCode: realMeetingCode,
      calendarLink: res.calendarLink || '',
      agenda: agenda.length > 0 ? agenda : [
        `Introduction and key objectives for ${skill}`,
        `Step-by-step screen share & live exercises`,
        `Q&A and follow-up resources`
      ],
      createdAt: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev.filter(s => s.id !== sessionId)]);
    broadcast?.postMessage({ type: 'NEW_SESSION', payload: newSession });

    // Save to Firestore if live credentials are configured
    if (isFirebaseLive) {
      await createFirestoreSession(newSession);
    }

    // Notify peer
    notifyUser(
      peerId,
      'New Learning Session Scheduled!',
      `${currentUser.name} scheduled a ${skill} session with you for ${new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}. Google Meet is ready!`,
      '/sessions',
      'session_scheduled'
    );

    // Also auto-post a meeting invite card message into their chat
    const conn = connections.find(c => c.userIds.includes(currentUser.uid) && c.userIds.includes(peerId));
    if (conn) {
      const meetMsg = {
        id: 'msg_meet_' + Date.now().toString(36),
        connectionId: conn.id,
        senderId: currentUser.uid,
        text: `📅 Scheduled a session for "${skill}" on ${new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}!\nGoogle Meet Link: ${realMeetingUri}`,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => ({
        ...prev,
        [conn.id]: [...(prev[conn.id] || []), meetMsg]
      }));
      broadcast?.postMessage({
        type: 'NEW_MESSAGE',
        payload: { connectionId: conn.id, message: meetMsg }
      });
      if (isFirebaseLive) {
        sendFirestoreMessage(conn.id, meetMsg).catch(() => {});
      }
    }

    api.createSession(newSession).catch(() => {});

    return newSession;
  };

  // 5. Complete Session & Award Base Credits
  const completeSession = async (sessionId) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'completed', completedAt: new Date().toISOString() } : s));
    broadcast?.postMessage({ type: 'SESSION_COMPLETED', payload: { sessionId } });

    if (isFirebaseLive) {
      updateFirestoreSession(sessionId, { status: 'completed', completedAt: new Date().toISOString() }).catch(() => {});
    }

    // Award credits to Teacher (+20) and Learner (+10)
    const teacher = allUsers.find(u => u.uid === targetSession.teacherId);
    const learner = allUsers.find(u => u.uid === targetSession.learnerId);

    if (teacher) {
      saveUser({
        ...teacher,
        credits: (teacher.credits || 0) + 20,
        sessionsTaught: (teacher.sessionsTaught || 0) + 1,
        sessionsCompleted: (teacher.sessionsCompleted || 0) + 1
      });
    }
    if (learner) {
      saveUser({
        ...learner,
        credits: (learner.credits || 0) + 10,
        sessionsLearned: (learner.sessionsLearned || 0) + 1,
        sessionsCompleted: (learner.sessionsCompleted || 0) + 1
      });
    }

    notifyUser(
      targetSession.teacherId === currentUser?.uid ? targetSession.learnerId : targetSession.teacherId,
      'Session Marked Completed',
      'The learning session was marked as completed. Please share feedback!',
      '/sessions',
      'session_completed'
    );

    api.completeSession(sessionId).catch(() => {});
  };

  // 6. Submit Feedback & Rating
  const submitFeedback = async ({ sessionId, reviewerId, revieweeId, rating, comment, whatLearned, usefulness, wouldLearnAgain }) => {
    const feedbackItem = {
      id: 'fb_' + Date.now().toString(36),
      sessionId,
      reviewerId,
      revieweeId,
      rating: Number(rating),
      comment,
      whatLearned,
      usefulness: usefulness || 'Very useful',
      wouldLearnAgain: wouldLearnAgain !== false,
      createdAt: new Date().toISOString()
    };

    setFeedback(prev => [feedbackItem, ...prev]);
    broadcast?.postMessage({ type: 'NEW_FEEDBACK', payload: feedbackItem });

    if (isFirebaseLive) {
      createFirestoreFeedback(feedbackItem).catch(() => {});
    }

    // Update target reviewee user profile
    const targetUser = allUsers.find(u => u.uid === revieweeId);
    if (targetUser) {
      const allTargetFeedbacks = [...feedback.filter(f => f.revieweeId === revieweeId), feedbackItem];
      const sum = allTargetFeedbacks.reduce((acc, f) => acc + f.rating, 0);
      const newRating = Number((sum / allTargetFeedbacks.length).toFixed(1));

      let bonusCredits = 0;
      if (Number(rating) === 5) bonusCredits += 5;

      const updatedBadges = [...(targetUser.badges || [])];
      if (newRating >= 4.8 && !updatedBadges.includes('5-Star Mentor')) {
        updatedBadges.push('5-Star Mentor');
      }

      saveUser({
        ...targetUser,
        rating: newRating,
        reviewCount: allTargetFeedbacks.length,
        credits: (targetUser.credits || 0) + bonusCredits,
        badges: updatedBadges
      });

      notifyUser(
        revieweeId,
        'New Feedback Received!',
        `${currentUser.name} rated your session ${rating} ★: "${comment || 'Great experience!'}"`,
        `/profile/${revieweeId}`,
        'feedback_received'
      );
    }

    // Celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) { /* ignore */ }

    api.submitFeedback(sessionId, feedbackItem).catch(() => {});

    return feedbackItem;
  };

  const markNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => n.userId === currentUser.uid ? { ...n, read: true } : n));
    api.markNotificationsRead(currentUser.uid).catch(() => {});
  };

  return (
    <SyncContext.Provider value={{
      requests,
      connections,
      messages,
      sessions,
      feedback,
      notifications,
      sendConnectionRequest,
      respondToConnectionRequest,
      sendMessage,
      scheduleSession,
      completeSession,
      submitFeedback,
      markNotificationsAsRead
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
}
