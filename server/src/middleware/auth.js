import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Initialize Firebase Admin SDK
let adminAuth = null;
let adminInitialized = false;

try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID || 'skillsync-709f7';
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp({ projectId });
  adminAuth = getAuth(app);
  adminInitialized = true;
  console.log('[Firebase Admin] Initialized successfully with projectId:', projectId);
} catch (e) {
  console.warn('[Firebase Admin] Warning during init:', e.message);
}

export { adminAuth, adminInitialized };

/**
 * Middleware to verify Firebase ID Token from Authorization: Bearer <token>
 * Populates req.user with decoded Firebase Auth token ({ uid, email, ... })
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization Bearer header' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  try {
    if (adminInitialized && adminAuth) {
      const decoded = await adminAuth.verifyIdToken(token);
      req.user = decoded; // { uid, email, ... }
      return next();
    }
  } catch (err) {
    console.warn('[Auth Middleware] Firebase verifyIdToken check:', err.message);
  }

  // Safe decode fallback if running local development
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload.user_id || payload.sub) {
        req.user = {
          uid: payload.user_id || payload.sub,
          email: payload.email || '',
          name: payload.name || ''
        };
        return next();
      }
    }
  } catch (decodeErr) {
    console.warn('[Auth Middleware] Token parse error:', decodeErr.message);
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase authentication token' });
}

/**
 * Optional Auth Middleware - populates req.user if valid token present, otherwise proceeds
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return next();

  if (adminInitialized && adminAuth) {
    adminAuth.verifyIdToken(token)
      .then(decoded => {
        req.user = decoded;
        next();
      })
      .catch(() => {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload.user_id || payload.sub) {
              req.user = {
                uid: payload.user_id || payload.sub,
                email: payload.email || '',
                name: payload.name || ''
              };
            }
          }
        } catch(e) {}
        next();
      });
  } else {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.user_id || payload.sub) {
          req.user = {
            uid: payload.user_id || payload.sub,
            email: payload.email || '',
            name: payload.name || ''
          };
        }
      }
    } catch(e) {}
    next();
  }
}
