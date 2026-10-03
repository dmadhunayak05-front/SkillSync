const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
    console.warn(`[API] ${endpoint} request failed:`, error.message);
    throw error;
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
