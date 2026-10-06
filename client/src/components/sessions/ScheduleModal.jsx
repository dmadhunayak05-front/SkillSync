import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { api } from '../../services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  KeyRound,
  ArrowRight
} from 'lucide-react';

export default function ScheduleModal({ isOpen, onClose, peerUser, preselectedSkill, onScheduled }) {
  const { currentUser } = useAuth();
  const { scheduleSession } = useSync();

  const availableSkills = peerUser?.skillsToTeach || ['Python', 'Figma', 'Web Development'];
  const [skill, setSkill] = useState(preselectedSkill || availableSkills[0] || 'Python');

  // Tomorrow as default date
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(tomorrowStr);
  const [time, setTime] = useState('17:00'); // 5:00 PM
  const [duration, setDuration] = useState('45');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSession, setCreatedSession] = useState(null);

  // Google OAuth Authorization State
  const [meetStatus, setMeetStatus] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [showCredsForm, setShowCredsForm] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);

  // Check Google Meet configuration status when modal opens
  const refreshMeetStatus = async () => {
    try {
      const status = await api.getMeetStatus(currentUser?.uid);
      setMeetStatus(status);
      if (status.isAuthorized) {
        setAuthRequired(false);
      }
    } catch (e) {
      console.warn('Could not check meet status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshMeetStatus();
    }
  }, [isOpen, currentUser?.uid]);

  // Listen for OAuth completion message from the popup
  useEffect(() => {
    const handleAuthMessage = (e) => {
      if (e.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('[ScheduleModal] Google Auth Success message received!');
        setAuthorizing(false);
        setAuthRequired(false);
        setError('');
        refreshMeetStatus();
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [currentUser?.uid]);

  const handleStartGoogleAuth = async () => {
    setError('');
    setAuthorizing(true);
    try {
      const res = await api.getGoogleAuthUrl(currentUser?.uid);
      if (res?.authUrl) {
        const width = 560;
        const height = 660;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open(
          res.authUrl,
          'google_meet_auth_popup',
          `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no`
        );
        if (!popup) {
          // Fallback if popup blocked
          window.open(res.authUrl, '_blank');
        }
      } else {
        throw new Error('Could not retrieve Google authorization URL');
      }
    } catch (err) {
      setError(err.message || 'Failed to start Google authorization flow');
      setAuthorizing(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setError('Please provide both Client ID and Client Secret.');
      return;
    }
    setSavingCreds(true);
    setError('');
    try {
      const res = await api.saveGoogleCredentials({
        clientId: clientIdInput.trim(),
        clientSecret: clientSecretInput.trim()
      });
      if (res.status) {
        setMeetStatus(res.status);
        setShowCredsForm(false);
        // Automatically start the OAuth flow now that credentials are saved!
        handleStartGoogleAuth();
      }
    } catch (err) {
      setError(err.message || 'Failed to save Google credentials');
    } finally {
      setSavingCreds(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!skill) {
      setError('Please select a skill to learn.');
      return;
    }
    if (!date) {
      setError('Please choose a valid date.');
      return;
    }

    const scheduledDateTime = new Date(`${date}T${time}:00`);
    if (scheduledDateTime < new Date()) {
      setError('Selected time cannot be in the past.');
      return;
    }

    setLoading(true);
    setError('');

    // Safety timeout: stop spinner after 25s no matter what (Requirement 7 & 12)
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setError('Unable to create the learning session in time. Please check your connection and try again.');
    }, 25000);

    try {
      const session = await scheduleSession({
        title: title.trim() || `${skill} Peer Learning Session`,
        skill,
        peerId: peerUser.uid,
        scheduledAt: scheduledDateTime.toISOString(),
        duration: Number(duration),
        agenda: [
          `Setup & foundational concepts of ${skill}`,
          `Interactive exercise & screen share review`,
          `Q&A, feedback, and mutual next steps`
        ]
      });

      clearTimeout(safetyTimer);
      setCreatedSession(session);
      if (onScheduled) onScheduled(session);
    } catch (err) {
      clearTimeout(safetyTimer);
      console.error('[SCHEDULE ERROR]', err);
      if (err.code === 'GOOGLE_AUTH_REQUIRED' || err.message?.includes('Google Meet access is required')) {
        setAuthRequired(true);
        setError('Google Meet access is required to create a live session.');
      } else {
        setError(err.message || 'Unable to create the learning session. Please try again.');
      }
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCreatedSession(null);
    setAuthRequired(false);
    setError('');
    onClose();
  };

  const finalMeetingUri = createdSession?.meeting?.meetingUri || createdSession?.meetingUri;

  const handleJoinMeeting = () => {
    if (finalMeetingUri) {
      window.open(finalMeetingUri, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={createdSession ? "Session Confirmed! 🎉" : "Schedule Learning Session"}
      subtitle={createdSession ? "Real Google Meet link generated and ready" : `Set up a live 1-on-1 session with ${peerUser?.name || 'Peer'}`}
      maxWidth="max-w-lg"
    >
      {createdSession ? (
        <div className="space-y-5 text-center py-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h4 className="text-xl font-black text-slate-900">{createdSession.title}</h4>
            <p className="text-sm text-slate-600 mt-1">
              With <strong>{peerUser?.name}</strong> • {new Date(createdSession.scheduledAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at {new Date(createdSession.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Genuine Google Meet Link Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-600" />
                Real Google Meet URL
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Verified Google Meet Space
              </span>
            </div>
            <a
              href={finalMeetingUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono font-bold text-emerald-700 hover:text-emerald-800 break-all flex items-center gap-1.5 underline"
            >
              {finalMeetingUri}
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            </a>
            <p className="text-[11px] text-emerald-800/80">
              Both you and {peerUser?.name} will join this exact same meeting room.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleJoinMeeting}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              Join Google Meet
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Authorization Required Banner / Panel */}
          {authRequired && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Google Authorization Required
                  </h4>
                  <p className="text-xs text-amber-800 font-medium mt-0.5">
                    Google Meet access is required to create a live session.
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    SkillSync creates genuine, verified Google Meet spaces through Google's official API so both students enter the exact same call.
                  </p>
                </div>
              </div>

              {meetStatus?.hasClientId ? (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleStartGoogleAuth}
                    disabled={authorizing}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {authorizing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing with Google...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize Google Meet</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-1 space-y-2">
                  <p className="text-[11px] text-amber-800">
                    Google OAuth Client ID & Secret are required on the server to request meeting creation tokens.
                  </p>
                  
                  {!showCredsForm ? (
                    <button
                      type="button"
                      onClick={() => setShowCredsForm(true)}
                      className="py-2 px-3 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Configure Google OAuth Credentials</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSaveCredentials} className="p-3 bg-white rounded-xl border border-amber-200 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Google Client ID:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 12345-abc.apps.googleusercontent.com"
                          value={clientIdInput}
                          onChange={(e) => setClientIdInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Google Client Secret:
                        </label>
                        <input
                          type="password"
                          placeholder="GOCSPX-..."
                          value={clientSecretInput}
                          onChange={(e) => setClientSecretInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                          required
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={savingCreds}
                          className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          {savingCreds ? 'Saving...' : 'Save & Authorize'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCredsForm(false)}
                          className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {error && !authRequired && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Peer Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <img src={peerUser?.photoURL} alt={peerUser?.name} className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="text-xs font-bold text-slate-900">{peerUser?.name}</p>
                <p className="text-[11px] text-slate-500">{peerUser?.college} • ⭐ {peerUser?.rating?.toFixed(1) || '4.8'}</p>
              </div>
            </div>

            {/* Skill Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Skill To Learn
              </label>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {availableSkills.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Custom Title (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Session Focus / Title (Optional)
              </label>
              <input
                type="text"
                placeholder={`e.g. ${skill} Fundamentals & Code Review`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-brand-600" />
                  Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: '30', label: '30 mins' },
                  { val: '45', label: '45 mins (Rec)' },
                  { val: '60', label: '60 mins' },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.val}
                    onClick={() => setDuration(opt.val)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      duration === opt.val
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integration Banner */}
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between text-[11px] text-purple-900">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>Backend creates a <strong>genuine Google Meet space</strong> via official Google API.</span>
              </div>
              {meetStatus?.isAuthorized ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  ✓ Authorized
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Auth Required
                </span>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || authorizing || savingCreds}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating session & Google Meet...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Create Learning Session</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
