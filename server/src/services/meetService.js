import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_PATH = path.join(__dirname, '..', 'data', 'google_tokens.json');
const CONFIG_PATH = path.join(__dirname, '..', 'data', 'google_config.json');

/**
 * Service to handle REAL Google Meet integration.
 * Supports:
 * 1. Official Google Meet REST API v2 (spaces.create)
 * 2. Official Google Calendar API with conferenceData (hangoutsMeet)
 * 3. Official Google OAuth2 authorization flow for user consent
 * 
 * STRICT COMPLIANCE:
 * - NO fake or random meeting code generation.
 * - If Google OAuth authorization is missing, returns GOOGLE_AUTH_REQUIRED.
 * - The meeting URI returned by Google is the single source of truth.
 */

function loadSavedTokens(userId = null) {
  try {
    if (fs.existsSync(TOKENS_PATH)) {
      const data = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));
      if (userId && data.users && data.users[userId]) {
        return data.users[userId];
      }
      return data.defaultTokens || (data.access_token || data.refresh_token ? data : null);
    }
  } catch (err) {
    console.warn('[MeetService] Could not read saved Google tokens:', err.message);
  }
  return null;
}

function saveTokens(tokens, userId = null) {
  try {
    const dir = path.dirname(TOKENS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(TOKENS_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));
      } catch (e) {
        data = {};
      }
    }
    data.users = data.users || {};
    if (userId) {
      data.users[userId] = tokens;
      console.log(`[MeetService] Google OAuth tokens associated with Firebase UID: ${userId}`);
    }
    data.defaultTokens = tokens;
    // Also save top-level for backward compatibility
    data.access_token = tokens.access_token;
    data.refresh_token = tokens.refresh_token || data.refresh_token;
    data.expiry_date = tokens.expiry_date;

    fs.writeFileSync(TOKENS_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log('[MeetService] Google OAuth tokens saved successfully.');
  } catch (err) {
    console.error('[MeetService] Failed to save Google OAuth tokens:', err.message);
  }
}

function loadSavedConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('[MeetService] Could not read saved Google config:', err.message);
  }
  return {};
}

export function saveCredentials({ clientId, clientSecret, redirectUri }) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const current = loadSavedConfig();
  const updated = {
    ...current,
    clientId: (clientId && clientId.trim()) || current.clientId || process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: (clientSecret && clientSecret.trim()) || current.clientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: (redirectUri && redirectUri.trim()) || current.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function getEffectiveConfig(userId = null) {
  const savedConfig = loadSavedConfig();
  const clientId = process.env.GOOGLE_CLIENT_ID || savedConfig.clientId || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || savedConfig.clientSecret || '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || savedConfig.redirectUri || 'http://localhost:5000/api/auth/google/callback';
  const savedTokens = loadSavedTokens(userId);
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || savedTokens?.refresh_token || '';

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: redirectUri.trim(),
    refreshToken: refreshToken.trim(),
    hasSavedTokens: Boolean(savedTokens && (savedTokens.access_token || savedTokens.refresh_token))
  };
}

export function getOAuth2Client(userId = null) {
  const config = getEffectiveConfig(userId);
  if (!config.clientId || !config.clientSecret) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  const savedTokens = loadSavedTokens(userId);
  if (savedTokens) {
    oauth2Client.setCredentials(savedTokens);
  } else if (config.refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: config.refreshToken
    });
  }

  return oauth2Client;
}

export function getMeetConfigStatus(userId = null) {
  const config = getEffectiveConfig(userId);
  const hasClientId = Boolean(config.clientId);
  const hasClientSecret = Boolean(config.clientSecret);
  const hasRefreshToken = Boolean(config.refreshToken || config.hasSavedTokens);
  const isAuthorized = hasClientId && hasClientSecret && hasRefreshToken;

  let authUrl = null;
  if (hasClientId && hasClientSecret) {
    try {
      authUrl = getGoogleAuthUrl(userId);
    } catch (e) {
      // Ignored
    }
  }

  return {
    isConfigured: hasClientId && hasClientSecret,
    isAuthorized,
    hasClientId,
    hasClientSecret,
    hasRefreshToken,
    redirectUri: config.redirectUri,
    authUrl,
    message: isAuthorized 
      ? 'Google Meet integration is authorized and ready to generate real meeting rooms.' 
      : hasClientId && hasClientSecret 
        ? 'Google Meet access is required to create a live session. Please authorize your Google account.' 
        : 'Google OAuth credentials (Client ID and Client Secret) are not yet configured.'
  };
}

export function getGoogleAuthUrl(userId = null) {
  const config = getEffectiveConfig(userId);
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Google Client ID and Client Secret must be configured before generating an authorization URL.');
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/meetings.space.created',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    include_granted_scopes: true,
    state: userId || 'default'
  });
}

export async function handleOAuthCallback(code, userId = null) {
  const config = getEffectiveConfig(userId);
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Google OAuth credentials not configured on server.');
  }

  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Preserve existing refresh_token if new response doesn't include one
  const existingTokens = loadSavedTokens(userId) || {};
  const mergedTokens = {
    ...existingTokens,
    ...tokens,
    refresh_token: tokens.refresh_token || existingTokens.refresh_token || config.refreshToken
  };

  saveTokens(mergedTokens, userId);

  return {
    success: true,
    tokens: mergedTokens
  };
}

/**
 * Creates a REAL Google Meet meeting using official Google APIs.
 * 
 * Strict constraints:
 * - NO fake/random code generation.
 * - Returns the exact meetingUri returned by Google.
 * - Returns structured meeting object: { provider: 'google_meet', spaceName, meetingUri }.
 */
function withTimeout(promise, ms, operationName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${ms}ms`)), ms)
    )
  ]);
}

export async function createGoogleMeetSession({
  title = 'SkillSync Learning Session',
  description = 'Peer-to-peer skill exchange on SkillSync',
  scheduledAt,
  durationMinutes = 45,
  teacherEmail,
  learnerEmail,
  userId = null
}) {
  const status = getMeetConfigStatus(userId);

  // If Google OAuth authorization is missing, DO NOT generate a fake link.
  // Instead throw an authorization error so the client can prompt the user to authorize.
  if (!status.isAuthorized) {
    const error = new Error('Google Meet access is required to create a live session.');
    error.code = 'GOOGLE_AUTH_REQUIRED';
    error.status = 401;
    error.authUrl = status.authUrl;
    error.details = status;
    throw error;
  }

  console.log('[SCHEDULE] obtaining Google OAuth token');
  const oauth2Client = getOAuth2Client(userId);
  if (!oauth2Client) {
    const error = new Error('Google Meet access is required to create a live session.');
    error.code = 'GOOGLE_AUTH_REQUIRED';
    error.status = 401;
    throw error;
  }

  let createdMeeting = null;
  let creationErrors = [];

  // Approach 1: Google Meet REST API v2 (spaces.create)
  try {
    console.log('[SCHEDULE] creating Google Meet space (spaces.create)');
    const meet = google.meet({ version: 'v2', auth: oauth2Client });
    const spaceRes = await withTimeout(
      meet.spaces.create({
        requestBody: {
          config: {
            accessType: 'OPEN'
          }
        }
      }),
      10000,
      'Google Meet spaces.create'
    );

    if (spaceRes.data && spaceRes.data.meetingUri) {
      createdMeeting = {
        provider: 'google_meet',
        spaceName: spaceRes.data.name || '',
        meetingUri: spaceRes.data.meetingUri, // EXACT URI RETURNED BY GOOGLE
        meetingCode: spaceRes.data.meetingCode || spaceRes.data.meetingUri.replace('https://meet.google.com/', ''),
        apiMode: 'google_meet_v2_spaces'
      };
      console.log(`[SCHEDULE] Meet created: ${createdMeeting.meetingUri}`);
    }
  } catch (meetApiErr) {
    console.warn('[MeetService] Google Meet API v2 spaces.create failed, trying Google Calendar API fallback:', meetApiErr.message);
    creationErrors.push({ api: 'meet_v2', error: meetApiErr.message });
  }

  // Approach 2: Google Calendar API v3 (conferenceData / hangoutsMeet)
  // Highly reliable across both Personal (@gmail.com) and Google Workspace accounts
  if (!createdMeeting) {
    try {
      console.log('[SCHEDULE] creating Google Meet space (calendar fallback)');
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const startIso = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString();
      const endIso = new Date(new Date(startIso).getTime() + durationMinutes * 60000).toISOString();

      const attendees = [];
      if (teacherEmail) attendees.push({ email: teacherEmail });
      if (learnerEmail) attendees.push({ email: learnerEmail });

      const calendarEvent = {
        summary: `SkillSync: ${title}`,
        description: `${description}\n\nConducted via SkillSync - Learn • Teach • Grow Together.`,
        start: { dateTime: startIso },
        end: { dateTime: endIso },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: uuidv4(),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      };

      const eventRes = await withTimeout(
        calendar.events.insert({
          calendarId: 'primary',
          conferenceDataVersion: 1,
          requestBody: calendarEvent,
        }),
        10000,
        'Google Calendar events.insert'
      );

      const meetingUri = eventRes.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === 'video'
      )?.uri || eventRes.data.hangoutLink;

      if (meetingUri) {
        createdMeeting = {
          provider: 'google_meet',
          spaceName: eventRes.data.id || 'calendar_event',
          meetingUri: meetingUri, // EXACT URI RETURNED BY GOOGLE
          meetingCode: meetingUri.replace('https://meet.google.com/', ''),
          calendarEventId: eventRes.data.id,
          calendarHtmlLink: eventRes.data.htmlLink,
          apiMode: 'google_calendar_hangouts_meet'
        };
        console.log(`[SCHEDULE] Meet created: ${createdMeeting.meetingUri}`);
      }
    } catch (calApiErr) {
      console.warn('[MeetService] Google Calendar conference creation failed:', calApiErr.message);
      creationErrors.push({ api: 'calendar_v3', error: calApiErr.message });
    }
  }

  // If both official APIs failed, THROW the real error with details.
  // NEVER generate a fake or random link.
  if (!createdMeeting) {
    const errorMsg = creationErrors.map(e => `${e.api}: ${e.error}`).join(' | ');
    const err = new Error(`Failed to create real Google Meet space through Google APIs: ${errorMsg}`);
    err.code = 'GOOGLE_API_CREATION_FAILED';
    err.details = creationErrors;
    throw err;
  }

  // Return the real meeting information
  return {
    success: true,
    meeting: {
      provider: createdMeeting.provider,
      spaceName: createdMeeting.spaceName,
      meetingUri: createdMeeting.meetingUri // EXACT URI RETURNED BY GOOGLE
    },
    meetingUri: createdMeeting.meetingUri,
    meetingCode: createdMeeting.meetingCode,
    apiMode: createdMeeting.apiMode,
    createdAt: new Date().toISOString()
  };
}
