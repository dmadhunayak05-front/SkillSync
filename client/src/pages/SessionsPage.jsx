import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';

export default function SessionsPage({ initialSessionId, onNavigate }) {
  const { currentUser, allUsers } = useAuth();
  const { sessions, completeSession } = useSync();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'all'
  const [activeWorkspaceSession, setActiveWorkspaceSession] = useState(
    initialSessionId ? sessions.find(s => s.id === initialSessionId) : null
  );
  const [feedbackSession, setFeedbackSession] = useState(null);

  const userSessions = sessions.filter(
    s => s.learnerId === currentUser?.uid || s.teacherId === currentUser?.uid
  );

  const upcomingSessions = userSessions.filter(s => s.status === 'scheduled');
  const completedSessions = userSessions.filter(s => s.status === 'completed');

  const displayedSessions = activeTab === 'upcoming' 
    ? upcomingSessions 
    : activeTab === 'completed' 
    ? completedSessions 
    : userSessions;

  const handleMarkCompleted = async (sessionId) => {
    await completeSession(sessionId);
    const updated = sessions.find(s => s.id === sessionId);
    if (updated) {
      setFeedbackSession(updated);
    }
  };

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
            peerUser={allUsers.find(u => u.uid === (activeWorkspaceSession.teacherId === currentUser?.uid ? activeWorkspaceSession.learnerId : activeWorkspaceSession.teacherId))}
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
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">
                {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No sessions found'}
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
                const peerId = session.teacherId === currentUser?.uid ? session.learnerId : session.teacherId;
                const peer = allUsers.find(u => u.uid === peerId) || session.peer || (session.teacherId === currentUser?.uid ? session.learner : session.teacher) || {
                  name: session.teacherId === currentUser?.uid ? 'Student Partner' : 'Skill Mentor',
                  photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId || 'peer'}`,
                  college: 'SkillSync Network'
                };
                const isTeacher = session.teacherId === currentUser?.uid;
                const isCompleted = session.status === 'completed';

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
                          <h3 className="font-extrabold text-base text-slate-900">{session.title}</h3>
                          <StatusBadge status={session.status} />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                            {isTeacher ? 'You are Teaching' : 'You are Learning'}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-500">
                          With <strong>{peer?.name}</strong> • {peer?.college}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            {new Date(session.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>{session.duration} minutes</span>
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
                          {Boolean(session.meeting?.meetingUri || session.meetingUri) && (
                            <a
                              href={session.meeting?.meetingUri || session.meetingUri}
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
        const peerId = feedbackSession.teacherId === currentUser?.uid ? feedbackSession.learnerId : feedbackSession.teacherId;
        const peer = allUsers.find(u => u.uid === peerId) || feedbackSession.peer || (feedbackSession.teacherId === currentUser?.uid ? feedbackSession.learner : feedbackSession.teacher) || {
          uid: peerId,
          name: feedbackSession.teacherId === currentUser?.uid ? 'Student Partner' : 'Skill Mentor',
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
