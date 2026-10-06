import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import LiveMeetingWorkspace from '../components/sessions/LiveMeetingWorkspace';
import FeedbackModal from '../components/sessions/FeedbackModal';
import { 
  Calendar, 
  Video, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  Star, 
  Plus,
  ArrowRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';

export default function SessionsPage({ initialSessionId, onNavigate }) {
  const { user, currentUser, allUsers, loading: authLoading } = useAuth();
  const { sessions, completeSession } = useSync();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'all'
  const [activeWorkspaceSession, setActiveWorkspaceSession] = useState(null);
  const [feedbackSession, setFeedbackSession] = useState(null);
  const [error, setError] = useState(null);

  // Authenticated user ID is strictly derived from Firebase Auth
  const currentUid = user?.uid || currentUser?.uid;

  // Requirement 10: Mandatory Debug Logging
  useEffect(() => {
    console.log("[LIVE SESSIONS DEBUG]", {
      authUid: user?.uid || currentUser?.uid,
      authEmail: user?.email || currentUser?.email,
      sessionCount: sessions?.length,
      sessions
    });
    console.log("[ROUTE DEBUG] /live-sessions loaded");
  }, [user?.uid, currentUser?.uid, sessions]);

  // Sync initialSessionId to activeWorkspaceSession safely
  useEffect(() => {
    if (initialSessionId && Array.isArray(sessions)) {
      const match = sessions.find(s => s && s.id === initialSessionId);
      if (match) {
        setActiveWorkspaceSession(match);
      }
    }
  }, [initialSessionId, sessions]);

  // Safe filter: guaranteed to handle null/undefined sessions and multi-user isolation
  const userSessions = (Array.isArray(sessions) ? sessions : []).filter(
    s => s && (s.learnerId === currentUid || s.teacherId === currentUid)
  );

  const upcomingSessions = userSessions.filter(s => s && s.status === 'scheduled');
  const completedSessions = userSessions.filter(s => s && s.status === 'completed');

  const displayedSessions = activeTab === 'upcoming' 
    ? upcomingSessions 
    : activeTab === 'completed' 
    ? completedSessions 
    : userSessions;

  const handleMarkCompleted = async (sessionId) => {
    try {
      await completeSession(sessionId);
      const updated = sessions.find(s => s && s.id === sessionId);
      if (updated) {
        setFeedbackSession(updated);
      }
    } catch (err) {
      console.error("[LIVE SESSIONS ERROR] Failed to complete session:", err);
      setError("Unable to update session status. Please try again.");
    }
  };

  // Safe date/time formatting helper: prevents invalid date string crashes
  const formatSessionTime = (rawDate) => {
    if (!rawDate) return 'Time to be scheduled';
    try {
      const d = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
      if (isNaN(d.getTime())) return 'Scheduled session';
      const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} at ${timeStr}`;
    } catch (e) {
      return 'Scheduled session';
    }
  };

  // Requirement 8: Explicit loading state while auth or sessions are resolving
  if (authLoading && !currentUser) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
        <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-extrabold text-slate-900">Loading sessions...</h3>
        <p className="text-xs text-slate-500">Checking your authenticated schedule...</p>
      </div>
    );
  }

  // Requirement 9: Error state display if an error is encountered
  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-200 shadow-xs text-center space-y-3 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">Unable to load learning sessions</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={() => setError(null)}
          className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      
      {/* If workspace is active, render LiveMeetingWorkspace */}
      {activeWorkspaceSession ? (
        <div className="space-y-4">
          <button
            onClick={() => setActiveWorkspaceSession(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            ← Back to all sessions
          </button>
          <LiveMeetingWorkspace
            session={activeWorkspaceSession}
            peerUser={allUsers.find(u => u && u.uid === (activeWorkspaceSession.teacherId === currentUid ? activeWorkspaceSession.learnerId : activeWorkspaceSession.teacherId))}
            onCompleteSession={handleMarkCompleted}
            onOpenFeedback={() => setFeedbackSession(activeWorkspaceSession)}
          />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>1-on-1 Learning Schedule</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Live Sessions & Meetings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Track your upcoming peer learning appointments with genuine Google Meet rooms.
              </p>
            </div>

            <button
              onClick={() => onNavigate('discover')}
              className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Session</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'upcoming'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Upcoming ({upcomingSessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Completed ({completedSessions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>All ({userSessions.length})</span>
            </button>
          </div>

          {/* Sessions List */}
          {displayedSessions.length === 0 ? (
            /* Requirement 8: Empty state */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                {activeTab === 'upcoming' ? 'No upcoming learning sessions' : 'No sessions found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {activeTab === 'upcoming' 
                  ? 'Find a skill peer on the discovery page or chat with your connections to book your next session.' 
                  : 'Completed sessions will appear here with reviews and earned credits.'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => onNavigate('discover')}
                  className="py-2.5 px-5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
                >
                  Explore Peer Mentors
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedSessions.map((session) => {
                if (!session || !session.id) return null;

                const isTeacher = session.teacherId === currentUid;
                const peerId = isTeacher ? session.learnerId : session.teacherId;
                const peer = allUsers.find(u => u && u.uid === peerId) || session.peer || (isTeacher ? session.learner : session.teacher) || {
                  name: isTeacher ? 'Student Partner' : 'Skill Mentor',
                  photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId || 'peer'}`,
                  college: 'SkillSync Network'
                };
                const isCompleted = session.status === 'completed';
                const meetUri = session.meeting?.meetingUri || session.meetingUri;
                const sessionTitle = session.title || session.topic || (session.skill ? `Learning Session: ${session.skill}` : 'Skill Exchange Session');

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-brand-200 transition-all"
                  >
                    {/* Left: Session Info & Peer */}
                    <div className="flex items-start sm:items-center gap-4">
                      <img
                        src={peer?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId || 'peer'}`}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">{sessionTitle}</h3>
                          <StatusBadge status={session.status} />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                            {isTeacher ? 'You are Teaching' : 'You are Learning'}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-500">
                          With <strong>{peer?.name || 'Peer Student'}</strong> • {peer?.college || 'SkillSync'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            {formatSessionTime(session.scheduledAt)}
                          </span>
                          <span>•</span>
                          <span>{session.duration || 60} minutes</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {isTeacher ? '+20 credits' : '+10 credits'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
                      
                      {!isCompleted ? (
                        <>
                          {/* Requirement 7: Reuses the existing stored meetingUri */}
                          {Boolean(meetUri) && (
                            <a
                              href={meetUri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Video className="w-4 h-4" />
                              <span>Join Google Meet</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                          )}

                          <button
                            onClick={() => setActiveWorkspaceSession(session)}
                            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                          >
                            Workspace
                          </button>

                          <button
                            onClick={() => handleMarkCompleted(session.id)}
                            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-bold text-xs transition-colors"
                            title="Mark Completed"
                          >
                            Complete
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setFeedbackSession(session)}
                            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <Star className="w-3.5 h-3.5 fill-slate-900" />
                            <span>Give Feedback</span>
                          </button>
                          <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </span>
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Feedback Modal */}
      {feedbackSession && (() => {
        const isTeacher = feedbackSession.teacherId === currentUid;
        const peerId = isTeacher ? feedbackSession.learnerId : feedbackSession.teacherId;
        const peer = allUsers.find(u => u && u.uid === peerId) || feedbackSession.peer || (isTeacher ? feedbackSession.learner : feedbackSession.teacher) || {
          uid: peerId,
          name: isTeacher ? 'Student Partner' : 'Skill Mentor',
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId || 'peer'}`
        };
        return (
          <FeedbackModal
            isOpen={Boolean(feedbackSession)}
            onClose={() => setFeedbackSession(null)}
            session={feedbackSession}
            peerUser={peer}
            onSubmitted={() => setFeedbackSession(null)}
          />
        );
      })()}

    </div>
  );
}
