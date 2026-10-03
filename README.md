# 🚀 SkillSync — “Learn • Teach • Grow Together”

> **Peer-to-Peer College Skill Exchange Platform with Real Google Meet Integration**

SkillSync connects college students to exchange knowledge 1-on-1: students who want to learn a skill (like Python or Flask) are matched with peers who can teach it, and who in turn want to learn what they know (like UI/UX or Figma). Once connected, students chat in real-time, schedule learning sessions, launch **genuine Google Meet conference rooms**, and rate each other to build reputation credits.

---

## 🌟 Hackathon Demo Highlights

- **Bilateral Matching Algorithm**: Computes compatibility based on direct skill overlap (40%), reciprocal value (25%), shared interests (20%), and availability (15%), complete with transparent **“Why this match?”** explanations.
- **Genuine Google Meet Integration**: Backend provisions actual Google Meet spaces (`https://meet.google.com/xxx-yyyy-zzz`). Clicking **[Join Google Meet]** opens the real Google Meet room where two students enter the exact same call.
- **Interactive Live Session Workspace**: In-session agenda checklists, step-by-step progress tracking, meeting countdown, and scratchpad notes.
- **Credit & Reputation Economy**: Students earn **+20 credits** for teaching, **+10 credits** for learning, and **+5 bonus credits** for 5-star reviews, unlocking badges like *"Python Mentor"* and *"5-Star Mentor"*.
- **Instant Persona Switcher**: Seamlessly toggle between **Manideep** (Learner) and **Rahul** (Teacher) to demonstrate the complete two-way flow live on stage.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Canvas Confetti |
| **Backend** | Node.js, Express.js, CORS, Googleapis SDK, UUID |
| **Database & Auth** | Firebase Authentication (Google Sign-In), Cloud Firestore, Multi-tab BroadcastChannel fallback |
| **Video Calls** | Google Meet REST API v2 & Google Calendar API with Hangouts Meet conference data |

---

## 🚦 Quick Start (Local Development)

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd "SkillSync Roshan"

# Install root, client, and server dependencies
npm install
npm --prefix client install
npm --prefix server install
```

### 2. Start Frontend & Backend Concurrently

```bash
# Runs Express backend on :5000 and Vite frontend on :5173
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🎬 5-Minute Hackathon Demonstration Script

Follow this exact scenario during judging:

1. **Landing Page**:
   - Open `http://localhost:5173`.
   - Show the hero banner: *"Learn from the right people. Share what you know."*
   - Scroll to the **Interactive Example Match**: show the **94% Match** between Manideep and Rahul with the *"Why you match"* checklist.
   - Click **[Launch App (Manideep)]**.

2. **Dashboard & Goal Progress**:
   - Notice the greeting: *"Good day, Manideep!"* and the active goal: *Master Python (72% complete)*.
   - Observe the quick statistics: 60 Credits, 4.9 Rating, 9 Sessions Completed.
   - Point out **Rahul Sharma (94% Match)** in the *"Recommended for you"* section.

3. **Discovery & Smart Matching**:
   - Navigate to **Discover Skills**.
   - Type `Python` into the search bar.
   - Notice **Rahul Sharma** appears at the top. Click **[Why this match?]** or **[View Profile]**.
   - Show the 4 intelligence signal cards: *Skill match*, *Two-way exchange*, *Relevant experience*, and *Schedule overlap*.

4. **Connection & Real-Time Chat**:
   - Click **[Send Learning Request]** (or switch to connections if already paired).
   - In the top right, switch role to **Rahul Sharma** to show Rahul accepting the request.
   - Navigate to **Messages / Chat**:
     - See the live conversation between Manideep and Rahul.
     - Type: *"Can we have a Python session tomorrow at 5?"*
     - Click **Send**. Notice real-time appearance without refreshing.

5. **Schedule Session & Create Real Google Meet**:
   - Inside the chat header, click **[Schedule Session]**.
   - Select: *Python*, *Tomorrow*, *5:00 PM*, *45 minutes*.
   - Click **[Create Learning Session]**.
   - The backend creates an actual Google Meet room (`https://meet.google.com/xxx-yyyy-zzz`).
   - A meeting card with a direct **[Join Google Meet Call]** link appears right inside the chat!

6. **Conduct Session & Workspace**:
   - Navigate to **Live Sessions**.
   - Click **[Join Google Meet]**: The real Google Meet room opens in a new tab.
   - Click **[Workspace]**: Show the live agenda checklist and check off steps.
   - Click **[Mark Completed]**.

7. **Feedback & Reputation Growth**:
   - Click **[Give Feedback]**.
   - Give 5 stars ★★★★★ and write: *"Rahul explained Flask APIs so clearly!"*.
   - Click **[Submit Feedback]**: Confetti shoots across the screen!
   - Switch role to **Rahul Sharma**:
     - Rahul's credits jump by **+20** (+5 bonus).
     - Rating updates to **4.9 ★**.
     - Sessions completed increment to **13**.

---

## ⚙️ Google Cloud & Firebase Setup Guide

SkillSync works immediately out-of-the-box in zero-config demo mode for instant testing. When you're ready to connect your production Google Cloud & Firebase projects:

### 1. Firebase Setup (Authentication & Firestore)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (e.g. `skillsync-prod`).
2. In **Build > Authentication**, enable **Google Sign-In**.
3. In **Build > Firestore Database**, create a database in test or production mode.
4. Go to **Project Settings > General > Your apps**, select **Web app (`</>`)**, and copy the `firebaseConfig`.
5. Paste these into `client/.env`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=skillsync-prod.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=skillsync-prod
   VITE_FIREBASE_STORAGE_BUCKET=skillsync-prod.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   ```
6. Deploy Firestore security rules using `firebase deploy --only firestore:rules` or paste the contents of `firestore.rules` into the Firebase Console Rules tab.

### 2. Google Meet & Calendar API Setup
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project and navigate to **APIs & Services > Library**.
3. Enable both:
   - **Google Meet API**
   - **Google Calendar API**
4. Navigate to **APIs & Services > OAuth consent screen**:
   - Select **External**, fill in App Name (`SkillSync`) and support email.
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/meetings.space.created`
5. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs: `http://localhost:5000/api/auth/google/callback` (and your production URL).
   - Copy the **Client ID** and **Client Secret**.
6. Set these in `server/.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REFRESH_TOKEN=your_refresh_token
   ```

---

## 🚀 Deployment Instructions

### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Add environment variables from `client/.env.example`.
5. Deploy!

### Backend (Render / Railway)
1. In [Render](https://render.com), create a new **Web Service**.
2. Set **Root Directory** to `server`.
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Add environment variables (`PORT`, `GOOGLE_CLIENT_ID`, etc.).
6. Update `VITE_API_BASE_URL` on Vercel to point to your Render backend URL.

---

## 🔒 Security
- Security rules in `firestore.rules` protect sensitive data, enforcing that only participants in a connection can read/write their messages.
- All Google client secrets and OAuth credentials stay strictly on the backend.
