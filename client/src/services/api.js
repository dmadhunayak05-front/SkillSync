import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeout || 20000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Automatically attach Firebase Auth ID token if student is signed in
    if (auth && auth.currentUser) {
      try {
        const idToken = await Promise.race([
          auth.currentUser.getIdToken(),
          new Promise((_, r) => setTimeout(() => r(new Error('token timeout')), 3000))
        ]);
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
      } catch (tokErr) {
        console.warn('[API] Could not retrieve Firebase ID token:', tokErr.message);
      }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      signal: controller.signal,
      ...options,
    });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const err = new Error(errBody.message || errBody.error || `Request failed with status ${res.status}`);
      err.code = errBody.error || errBody.code;
      err.authUrl = errBody.authUrl;
      err.details = errBody.details;
      throw err;
    }
    return await res.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please check your connection and try again.');
      timeoutErr.code = 'REQUEST_TIMEOUT';
      console.warn(`[API] ${endpoint} request timed out after ${timeoutMs}ms`);
      throw timeoutErr;
    }
    console.warn(`[API] ${endpoint} request failed:`, error.message);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  getHealth: () => request('/health'),
  getMeetStatus: (userId) => request(`/meet/status${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  getGoogleAuthUrl: (userId) => request(`/auth/google/url${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`),
  saveGoogleCredentials: (data) => request('/auth/google/credentials', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  createGoogleMeet: (data) => request('/meet/create', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  syncUser: (userData) => request('/users/sync', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  getMatches: (userId) => request(`/matches?userId=${encodeURIComponent(userId)}`),

  getConnectionRequests: (userId) => request(`/connections/requests?userId=${encodeURIComponent(userId)}`),
  sendConnectionRequest: (data) => request('/connections/request', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  respondToConnectionRequest: (id, action) => request(`/connections/requests/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }),

  getConnections: (userId) => request(`/connections?userId=${encodeURIComponent(userId)}`),

  getMessages: (connectionId) => request(`/chat/${connectionId}/messages`),
  sendMessage: (connectionId, { senderId, text }) => request(`/chat/${connectionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ senderId, text })
  }),

  getSessions: (userId) => request(`/sessions?userId=${encodeURIComponent(userId)}`),
  createSession: (sessionData) => request('/sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  }),
  completeSession: (sessionId) => request(`/sessions/${sessionId}/complete`, {
    method: 'POST'
  }),
  submitFeedback: (sessionId, feedbackData) => request(`/sessions/${sessionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedbackData)
  }),

  getNotifications: (userId) => request(`/notifications?userId=${encodeURIComponent(userId)}`),
  markNotificationsRead: (userId) => request('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),

  resetDemoData: () => request('/demo/reset', {
    method: 'POST'
  })
};
