import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  createGoogleMeetSession,
  getMeetConfigStatus,
  getGoogleAuthUrl,
  handleOAuthCallback,
  saveCredentials
} from './services/meetService.js';
import { calculateMatch } from './services/matchService.js';
import { DEMO_USERS } from './data/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// In-Memory Data Store (Initialized with realistic hackathon seed data)
const db = {
  users: new Map(DEMO_USERS.map(u => [u.uid, { ...u }])),
  connectionRequests: new Map(),
  connections: new Map(),
  messages: new Map(), // connectionId -> Array of messages
  sessions: new Map(),
  feedback: new Map(),
  notifications: new Map() // userId -> Array of notifications
};

// Seed an initial connection and demo session between Rahul and Manideep so judges immediately see data!
const initialConnId = 'conn_rahul_manideep';
db.connections.set(initialConnId, {
  id: initialConnId,
  userIds: ['user_rahul', 'user_manideep'],
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  lastMessage: 'Sure, 5 PM works for our Python session tomorrow.',
  lastMessageAt: new Date(Date.now() - 3600000).toISOString()
});

db.messages.set(initialConnId, [
  {
    id: 'msg_1',
    connectionId: initialConnId,
    senderId: 'user_manideep',
    text: "Hey Rahul! I saw you have deep experience in Python & Flask. I'd love to learn how to structure REST APIs.",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'msg_2',
    connectionId: initialConnId,
    senderId: 'user_rahul',
    text: "Hey Manideep! Absolutely. And I really want to learn UI/UX design systems in Figma from you!",
    createdAt: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'msg_3',
    connectionId: initialConnId,
    senderId: 'user_manideep',
    text: "Can we have a Python session tomorrow?",
    createdAt: new Date(Date.now() - 4000000).toISOString()
  },
  {
    id: 'msg_4',
    connectionId: initialConnId,
    senderId: 'user_rahul',
    text: "Sure, 5 PM works.",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
]);

// Initial upcoming session
const initialSessionId = 'session_demo_python';
const tomorrowAt5 = new Date();
tomorrowAt5.setDate(tomorrowAt5.getDate() + 1);
tomorrowAt5.setHours(17, 0, 0, 0);

db.sessions.set(initialSessionId, {
  id: initialSessionId,
  title: 'Python Fundamentals & Flask API Setup',
  skill: 'Python',
  learnerId: 'user_manideep',
  teacherId: 'user_rahul',
  scheduledAt: tomorrowAt5.toISOString(),
  duration: 45,
  status: 'scheduled',
  meeting: null,
  meetingUri: null,
  meetingCode: null,
  agenda: [
    'Quick overview of Python virtual environment',
    'Creating first Flask route and testing with curl/browser',
    'Understanding request/response JSON payload flow'
  ],
  createdAt: new Date().toISOString()
});

// Notifications
function addNotification(userId, notification) {
  if (!db.notifications.has(userId)) {
    db.notifications.set(userId, []);
  }
  const notif = {
    id: uuidv4(),
    userId,
    read: false,
    createdAt: new Date().toISOString(),
    ...notification
  };
  db.notifications.get(userId).unshift(notif);
  return notif;
}

// Seed initial notifications
addNotification('user_manideep', {
  title: 'Connection Accepted',
  message: 'Rahul Sharma accepted your learning request. You can now chat and schedule sessions!',
  type: 'connection_accepted',
  link: '/chat/conn_rahul_manideep'
});

addNotification('user_manideep', {
  title: 'Upcoming Learning Session',
  message: 'Python Fundamentals with Rahul Sharma is scheduled for tomorrow at 5:00 PM.',
  type: 'session_scheduled',
  link: '/sessions'
});

// ---------------- ROUTES ----------------

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'SkillSync API',
    version: '1.0.0',
    usersCount: db.users.size,
    sessionsCount: db.sessions.size,
    timestamp: new Date().toISOString()
  });
});

// Google Meet & OAuth Routes
app.get(['/api/meet/status', '/api/auth/google/status'], (req, res) => {
  const { userId } = req.query;
  const status = getMeetConfigStatus(userId);
  res.json(status);
});

app.get('/api/auth/google/url', (req, res) => {
  try {
    const { userId } = req.query;
    const authUrl = getGoogleAuthUrl(userId);
    res.json({ success: true, authUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/google/credentials', (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri, userId } = req.body;
    saveCredentials({ clientId, clientSecret, redirectUri });
    const status = getMeetConfigStatus(userId);
    res.json({ success: true, status });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Meet Authorization Failed</title></head>
        <body style="font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:40px;text-align:center;">
          <h2 style="color:#f43f5e;">Authorization Cancelled or Failed</h2>
          <p>${error}</p>
          <button onclick="window.close()" style="margin-top:20px;padding:10px 20px;border-radius:10px;background:#334155;color:#fff;border:none;cursor:pointer;">Close Window</button>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing from Google redirect.');
  }

  try {
    const targetUserId = state && state !== 'default' ? state : null;
    await handleOAuthCallback(code, targetUserId);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Meet Authorized - SkillSync</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 40px; text-align: center; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .icon { width: 60px; height: 60px; background: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 30px; }
            h2 { margin: 0 0 10px; color: #fff; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; }
            .btn { margin-top: 24px; padding: 12px 28px; border-radius: 12px; background: #7c3aed; color: #fff; border: none; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2>Google Meet Authorized!</h2>
            <p>SkillSync can now create genuine Google Meet video conference rooms through Google's official API.</p>
            <p style="margin-top:10px;color:#cbd5e1;font-size:12px;">This window will close automatically.</p>
            <button class="btn" onclick="window.close()">Return to SkillSync</button>
          </div>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', userId: '${targetUserId || ''}' }, '*');
                setTimeout(() => window.close(), 1800);
              }
            } catch(e) {}
          </script>
        </body>
      </html>
    `);
  } catch (authErr) {
    console.error('Error exchanging OAuth code:', authErr);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authorization Error</title></head>
        <body style="font-family:system-ui,sans-serif;background:#0f172a;color:#f8fafc;padding:40px;text-align:center;">
          <h2 style="color:#f43f5e;">Failed to complete authorization</h2>
          <p>${authErr.message}</p>
        </body>
      </html>
    `);
  }
});

// Create Google Meet Room (Official Google API)
app.post('/api/meet/create', async (req, res) => {
  try {
    const { title, description, scheduledAt, durationMinutes, teacherEmail, learnerEmail, userId, teacherId, learnerId } = req.body;
    const meetingData = await createGoogleMeetSession({
      title,
      description,
      scheduledAt,
      durationMinutes,
      teacherEmail,
      learnerEmail,
      userId: userId || teacherId || learnerId
    });
    res.json(meetingData);
  } catch (error) {
    console.error('Error creating Google Meet:', error.message);
    if (error.code === 'GOOGLE_AUTH_REQUIRED') {
      return res.status(401).json({
        error: 'GOOGLE_AUTH_REQUIRED',
        message: 'Google Meet access is required to create a live session.',
        authUrl: error.authUrl,
        details: error.details
      });
    }
    res.status(500).json({ error: error.message || 'Failed to create Google Meet session', code: error.code });
  }
});

// Users
app.get('/api/users', (req, res) => {
  const users = Array.from(db.users.values());
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.post('/api/users/sync', (req, res) => {
  const userData = req.body;
  if (!userData || !userData.uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  const existing = db.users.get(userData.uid) || {};
  const updated = {
    ...existing,
    ...userData,
    credits: existing.credits ?? userData.credits ?? 50,
    rating: existing.rating ?? userData.rating ?? 5.0,
    reviewCount: existing.reviewCount ?? userData.reviewCount ?? 0,
    sessionsCompleted: existing.sessionsCompleted ?? 0,
    sessionsTaught: existing.sessionsTaught ?? 0,
    sessionsLearned: existing.sessionsLearned ?? 0,
    badges: existing.badges || ['New Explorer'],
    updatedAt: new Date().toISOString()
  };

  db.users.set(userData.uid, updated);
  res.json(updated);
});

// Smart Matching Endpoint
app.get(['/api/matches', '/api/matches/:userId'], (req, res) => {
  const userId = req.params.userId || req.query.userId;
  const currentUser = db.users.get(userId);

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const allUsers = Array.from(db.users.values()).filter(u => u.uid !== userId);
  const matches = allUsers.map(peer => {
    const matchResult = calculateMatch(currentUser, peer);
    return {
      user: peer,
      ...matchResult
    };
  }).sort((a, b) => b.score - a.score);

  res.json({ matches, count: matches.length });
});

// Connection Requests
app.get('/api/connections/requests', (req, res) => {
  const { userId } = req.query;
  const requests = Array.from(db.connectionRequests.values()).filter(
    r => r.senderId === userId || r.receiverId === userId
  );
  res.json(requests);
});

app.post('/api/connections/request', (req, res) => {
  const { id, senderId, receiverId, message, skillOffered, skillRequested, senderName, senderPhotoURL, senderCollege, receiverName } = req.body;

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'senderId and receiverId are required' });
  }

  // Register sender and receiver if provided
  if (!db.users.has(senderId) && senderName) {
    db.users.set(senderId, {
      uid: senderId,
      name: senderName,
      photoURL: senderPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
      college: senderCollege || 'Tech University'
    });
  }

  // Check if connection already exists
  const existingConn = Array.from(db.connections.values()).find(
    c => c.userIds && c.userIds.includes(senderId) && c.userIds.includes(receiverId)
  );
  if (existingConn) {
    return res.status(400).json({ error: 'Already connected', connectionId: existingConn.id });
  }

  const requestId = id || uuidv4();
  const senderObj = db.users.get(senderId) || {
    uid: senderId,
    name: senderName || 'Student',
    photoURL: senderPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
    college: senderCollege || 'Tech University'
  };

  const request = {
    id: requestId,
    senderId,
    receiverId,
    sender: senderObj,
    senderName: senderObj.name,
    senderPhotoURL: senderObj.photoURL,
    senderCollege: senderObj.college || '',
    receiverName: receiverName || db.users.get(receiverId)?.name || 'Student',
    message: message || "I'd love to connect and exchange knowledge!",
    skillOffered: skillOffered || 'General Knowledge',
    skillRequested: skillRequested || 'Skill Mentorship',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.connectionRequests.set(requestId, request);

  const senderUser = db.users.get(senderId) || senderObj;
  addNotification(receiverId, {
    title: 'New Learning Request',
    message: `${senderUser?.name || 'A student'} wants to connect with you to learn ${skillRequested || 'skills'}!`,
    type: 'connection_request',
    link: '/connections'
  });

  res.status(201).json({ success: true, request });
});

app.post(['/api/connections/requests/:id/respond', '/api/connections/respond/:id'], (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' / 'accepted' or 'reject' / 'rejected'

  const request = db.connectionRequests.get(id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (action === 'accept' || action === 'accepted') {
    request.status = 'accepted';
    const connectionId = `conn_${request.senderId}_${request.receiverId}`;
    const user1 = db.users.get(request.senderId) || {
      uid: request.senderId,
      name: request.senderName || 'Student',
      photoURL: request.senderPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.senderId}`
    };
    const user2 = db.users.get(request.receiverId) || {
      uid: request.receiverId,
      name: request.receiverName || 'Student',
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.receiverId}`
    };

    const connection = {
      id: connectionId,
      userIds: [request.senderId, request.receiverId],
      user1,
      user2,
      createdAt: new Date().toISOString(),
      lastMessage: 'Connected! Say hello and schedule your first session.',
      lastMessageAt: new Date().toISOString()
    };

    db.connections.set(connectionId, connection);

    // Initial greeting message
    db.messages.set(connectionId, [
      {
        id: uuidv4(),
        connectionId,
        senderId: request.receiverId,
        text: `Hey! I've accepted your request. Looking forward to exchanging skills. Let's schedule a session!`,
        createdAt: new Date().toISOString()
      }
    ]);

    const receiver = db.users.get(request.receiverId) || user2;
    addNotification(request.senderId, {
      title: 'Connection Accepted',
      message: `${receiver?.name || 'Your peer'} accepted your learning request!`,
      type: 'connection_accepted',
      link: `/chat/${connectionId}`
    });

    return res.json({ success: true, request, connection });
  } else {
    request.status = 'rejected';
    return res.json({ success: true, request });
  }
});

// Connections
app.get('/api/connections', (req, res) => {
  const { userId } = req.query;
  const list = Array.from(db.connections.values())
    .filter(c => !userId || (c.userIds && c.userIds.includes(userId)))
    .map(c => {
      const otherId = c.userIds.find(id => id !== userId);
      const peer = otherId ? (db.users.get(otherId) || {
        uid: otherId,
        name: otherId === c.user1?.uid ? c.user1?.name : (c.user2?.name || 'Connected Student'),
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`
      }) : null;
      return {
        ...c,
        peer
      };
    });
  res.json(list);
});

// Chat Messages
app.get(['/api/chat/:connectionId/messages', '/api/chat/:connectionId/message'], (req, res) => {
  const { connectionId } = req.params;
  const msgs = db.messages.get(connectionId) || [];
  res.json(msgs);
});

app.post(['/api/chat/:connectionId/messages', '/api/chat/:connectionId/message'], (req, res) => {
  const { connectionId } = req.params;
  const { senderId, text } = req.body;

  if (!senderId || !text) {
    return res.status(400).json({ error: 'senderId and text are required' });
  }

  const message = {
    id: uuidv4(),
    connectionId,
    senderId,
    text,
    createdAt: new Date().toISOString()
  };

  if (!db.messages.has(connectionId)) {
    db.messages.set(connectionId, []);
  }
  db.messages.get(connectionId).push(message);

  // Update connection lastMessage
  const conn = db.connections.get(connectionId);
  if (conn) {
    conn.lastMessage = text;
    conn.lastMessageAt = message.createdAt;
  }

  res.status(201).json(message);
});

// Sessions
app.get('/api/sessions', (req, res) => {
  const { userId } = req.query;
  const sessions = Array.from(db.sessions.values())
    .filter(s => !userId || s.learnerId === userId || s.teacherId === userId)
    .map(s => ({
      ...s,
      learner: db.users.get(s.learnerId),
      teacher: db.users.get(s.teacherId)
    }))
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  res.json(sessions);
});

app.post('/api/sessions', async (req, res) => {
  try {
    const {
      title,
      skill,
      learnerId,
      teacherId,
      scheduledAt,
      duration = 45,
      agenda = [],
      meeting // if already created
    } = req.body;

    if (!learnerId || !teacherId || !skill || !scheduledAt) {
      return res.status(400).json({ error: 'learnerId, teacherId, skill, and scheduledAt are required' });
    }

    const teacher = db.users.get(teacherId) || { uid: teacherId, name: 'Mentor', email: '' };
    const learner = db.users.get(learnerId) || { uid: learnerId, name: 'Student', email: '' };

    let meetData = meeting;
    // If not already provided or missing meetingUri, create a REAL Google Meet via official Google APIs
    if (!meetData || !meetData.meetingUri) {
      try {
        meetData = await createGoogleMeetSession({
          title: title || `${skill} Peer Learning Session`,
          description: `SkillSync 1-on-1 session: ${skill} with ${teacher?.name || 'Peer'}.`,
          scheduledAt,
          durationMinutes: duration,
          teacherEmail: teacher?.email,
          learnerEmail: learner?.email,
          userId: req.body.userId || learnerId || teacherId
        });
      } catch (meetErr) {
        if (meetErr.code === 'GOOGLE_AUTH_REQUIRED') {
          return res.status(401).json({
            error: 'GOOGLE_AUTH_REQUIRED',
            message: 'Google Meet access is required to create a live session.',
            authUrl: meetErr.authUrl,
            details: meetErr.details
          });
        }
        throw meetErr;
      }
    }

    const sessionId = req.body.id || uuidv4();
    const finalMeetingUri = req.body.meetingUri || meetData.meeting?.meetingUri || meetData.meetingUri;
    const finalSpaceName = meetData.meeting?.spaceName || meetData.spaceName || '';
    const finalMeetingCode = req.body.meetingCode || meetData.meetingCode || (finalMeetingUri ? finalMeetingUri.replace('https://meet.google.com/', '') : '');

    const session = {
      id: sessionId,
      title: title || `${skill} Peer Learning Session`,
      skill,
      learnerId,
      teacherId,
      scheduledAt,
      duration,
      durationMinutes: duration,
      status: 'scheduled',
      meeting: {
        provider: 'google_meet',
        spaceName: finalSpaceName,
        meetingUri: finalMeetingUri // EXACT REAL URI FROM GOOGLE
      },
      meetingUri: finalMeetingUri,
      meetingCode: finalMeetingCode,
      calendarLink: meetData.calendarLink || '',
      agenda: agenda.length > 0 ? agenda : [
        `Intro and learning goals for ${skill}`,
        `Hands-on walkthrough and live practice`,
        `Q&A, next steps, and resource exchange`
      ],
      createdAt: new Date().toISOString()
    };

    db.sessions.set(sessionId, session);

    // Notify both users
    addNotification(learnerId, {
      title: 'Session Scheduled',
      message: `Your ${skill} session with ${teacher?.name || 'your mentor'} is confirmed for ${new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
      type: 'session_scheduled',
      link: '/sessions'
    });

    addNotification(teacherId, {
      title: 'New Session Booked',
      message: `${learner?.name || 'A student'} booked a ${skill} session with you for ${new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.`,
      type: 'session_scheduled',
      link: '/sessions'
    });

    res.status(201).json({
      ...session,
      learner,
      teacher
    });
  } catch (err) {
    console.error('Session creation error:', err);
    res.status(500).json({ error: 'Failed to schedule session', details: err.message });
  }
});

// Mark Session Completed
app.post('/api/sessions/:id/complete', (req, res) => {
  const { id } = req.params;
  const session = db.sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.status = 'completed';
  session.completedAt = new Date().toISOString();

  // Award base completion credits (+20 for teacher, +10 for learner)
  const teacher = db.users.get(session.teacherId);
  const learner = db.users.get(session.learnerId);

  if (teacher) {
    teacher.credits = (teacher.credits || 0) + 20;
    teacher.sessionsTaught = (teacher.sessionsTaught || 0) + 1;
    teacher.sessionsCompleted = (teacher.sessionsCompleted || 0) + 1;
  }
  if (learner) {
    learner.credits = (learner.credits || 0) + 10;
    learner.sessionsLearned = (learner.sessionsLearned || 0) + 1;
    learner.sessionsCompleted = (learner.sessionsCompleted || 0) + 1;
  }

  addNotification(session.learnerId, {
    title: 'Session Completed!',
    message: `Your session with ${teacher?.name || 'peer'} is completed. Leave feedback to award bonus credits!`,
    type: 'session_completed',
    link: '/sessions'
  });

  res.json({
    session,
    creditsAwarded: {
      teacher: 20,
      learner: 10
    }
  });
});

// Feedback & Rating Submission
app.post('/api/sessions/:id/feedback', (req, res) => {
  const { id } = req.params;
  const { reviewerId, revieweeId, rating, comment, whatLearned, wouldLearnAgain } = req.body;

  const session = db.sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const feedbackId = uuidv4();
  const feedbackItem = {
    id: feedbackId,
    sessionId: id,
    reviewerId,
    revieweeId,
    rating: Number(rating) || 5,
    comment: comment || '',
    whatLearned: whatLearned || '',
    wouldLearnAgain: wouldLearnAgain !== false,
    createdAt: new Date().toISOString()
  };

  db.feedback.set(feedbackId, feedbackItem);

  // Recalculate target user's rating & credits
  const targetUser = db.users.get(revieweeId);
  if (targetUser) {
    const userFeedbacks = Array.from(db.feedback.values()).filter(f => f.revieweeId === revieweeId);
    const sumRatings = userFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const newRating = Number((sumRatings / userFeedbacks.length).toFixed(1));

    targetUser.rating = newRating;
    targetUser.reviewCount = userFeedbacks.length;

    // 5-star bonus credits
    if (rating === 5) {
      targetUser.credits = (targetUser.credits || 0) + 5;
    }

    // Award badges if applicable
    if (targetUser.sessionsCompleted >= 10 && !targetUser.badges.includes('Knowledge Sharer')) {
      targetUser.badges.push('Knowledge Sharer');
    }
    if (targetUser.rating >= 4.8 && targetUser.reviewCount >= 5 && !targetUser.badges.includes('5-Star Mentor')) {
      targetUser.badges.push('5-Star Mentor');
    }

    addNotification(revieweeId, {
      title: 'New Feedback Received',
      message: `${db.users.get(reviewerId)?.name || 'Your peer'} left you a ${rating}-star review: "${comment || 'Great session!'}"`,
      type: 'feedback_received',
      link: `/profile/${revieweeId}`
    });
  }

  res.status(201).json({
    feedback: feedbackItem,
    updatedUser: targetUser
  });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  const list = db.notifications.get(userId) || [];
  res.json(list);
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { userId } = req.body;
  if (db.notifications.has(userId)) {
    db.notifications.get(userId).forEach(n => { n.read = true; });
  }
  res.json({ success: true });
});

// Reset Demo Data helper for Hackathon presentation
app.post('/api/demo/reset', (req, res) => {
  db.users = new Map(DEMO_USERS.map(u => [u.uid, { ...u }]));
  res.json({ success: true, message: 'Demo data restored' });
});

// Global Error Handling Middleware (catches body-parser JSON parse errors and unhandled errors)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('[Server] Bad JSON in request body:', err.message);
    return res.status(400).json({ error: 'Malformed JSON payload in request' });
  }
  console.error('[Server] Error handled by middleware:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 SkillSync Server running on http://localhost:${PORT}`);
  console.log(`📹 Real Google Meet integration ready`);
  console.log(`🤝 Demo users: ${DEMO_USERS.map(u => u.name).join(', ')}`);
  console.log(`===============================================`);
});
