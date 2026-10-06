import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { calculateMatch } from '../utils/matching';
import GoalProgressCard from '../components/dashboard/GoalProgressCard';
import RecommendedMatches from '../components/dashboard/RecommendedMatches';
import ConnectModal from '../components/discover/ConnectModal';
import { 
  Users, 
  Calendar, 
  Award, 
  BookOpen, 
  Star, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search 
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const { currentUser, allUsers } = useAuth();
  const { sessions, connections, requests, notifications = [] } = useSync();

  const [selectedStudentForConnect, setSelectedStudentForConnect] = useState(null);

  // Compute matches for current user
  const otherUsers = allUsers.filter(u => u.uid !== currentUser?.uid);
  const matches = otherUsers.map(peer => {
    const match = calculateMatch(currentUser, peer);
    return {
      user: peer,
      ...match
    };
  }).sort((a, b) => b.score - a.score);

  // User's upcoming sessions
  const userSessions = sessions.filter(
    s => (s.learnerId === currentUser?.uid || s.teacherId === currentUser?.uid) && s.status === 'scheduled'
  );
  const nextSession = userSessions[0];

  const pendingRequestsCount = requests.filter(r => r.receiverId === currentUser?.uid && r.status === 'pending').length;

  // User's active connections
  const userConnections = connections.filter(c => c.userIds?.includes(currentUser?.uid));

  // Compute real activity timeline
  const userNotifications = notifications.filter(n => n.userId === currentUser?.uid);
  const realActivities = [
    ...userNotifications.map(n => ({
      id: `notif-${n.id}`,
      icon: n.type === 'connection_accepted' ? CheckCircle2 : n.type === 'session_scheduled' ? Calendar : Clock,
      color: n.type === 'connection_accepted' ? 'emerald' : n.type === 'session_scheduled' ? 'brand' : 'indigo',
      title: n.title,
      description: n.message,
      time: n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recently'
    })),
    ...userSessions.map(s => ({
      id: `session-${s.id}`,
      icon: Calendar,
      color: 'brand',
      title: 'Session Scheduled',
      description: `${s.skill} session scheduled with ${s.teacherId === currentUser?.uid ? 'student' : 'mentor'}.`,
      time: s.createdAt ? new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Scheduled'
    })),
    ...userConnections.map(c => ({
      id: `conn-${c.id}`,
      icon: Users,
      color: 'emerald',
      title: 'Peer Connected',
      description: 'You connected with a new study partner.',
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Active'
    }))
  ].slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Greeting & Goal Progress (Inspired by Reference Image 2) */}
      <GoalProgressCard
        currentUser={currentUser}
        nextSession={nextSession}
        onNavigate={onNavigate}
      />

      {/* Quick Statistics Row (Section 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Learning</span>
            <BookOpen className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{currentUser?.skillsToLearn?.length || 0}</p>
          <span className="text-[10px] text-slate-400">Skills targeted</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Teaching</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{currentUser?.skillsToTeach?.length || 0}</p>
          <span className="text-[10px] text-slate-400">Skills offered</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Connections</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{userConnections.length}</p>
          <span className="text-[10px] text-slate-400">Active study peers</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Credits</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+20</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{currentUser?.credits || 50}</p>
          <span className="text-[10px] text-slate-400">Available balance</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Reputation</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{currentUser?.rating?.toFixed(1) || '5.0'}</p>
          <span className="text-[10px] text-slate-400">{currentUser?.sessionsCompleted || 0} sessions done</span>
        </div>

      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Quick Actions:</span>
          <button
            onClick={() => onNavigate('discover')}
            className="py-2 px-3.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Find a Skill
          </button>
          <button
            onClick={() => onNavigate('my-profile')}
            className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Offer New Skill
          </button>
          <button
            onClick={() => onNavigate('connections')}
            className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            View Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Signed in as:</span>
          <span className="text-xs font-bold text-slate-800">{currentUser?.name}</span>
        </div>
      </div>

      {/* Recommended Matches Section (Section 9) */}
      <RecommendedMatches
        matches={matches}
        onConnect={(peer) => setSelectedStudentForConnect(peer)}
        onViewProfile={(uid) => onNavigate('profile', { userId: uid })}
        onNavigate={onNavigate}
      />

      {/* Upcoming Sessions & Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Upcoming Sessions List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Your Scheduled Sessions</h3>
              <p className="text-xs text-slate-500">Live 1-on-1 sessions with Google Meet links ready to launch.</p>
            </div>
            <button
              onClick={() => onNavigate('sessions')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              All sessions →
            </button>
          </div>

          {userSessions.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No sessions scheduled right now.</p>
              <button
                onClick={() => onNavigate('discover')}
                className="text-xs text-brand-600 font-bold hover:underline"
              >
                Find a peer to schedule with →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userSessions.map((session) => {
                const peerId = session.teacherId === currentUser?.uid ? session.learnerId : session.teacherId;
                const peer = allUsers.find(u => u.uid === peerId);
                const isTeacher = session.teacherId === currentUser?.uid;

                return (
                  <div
                    key={session.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img src={peer?.photoURL} alt="" className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{session.title}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                            {isTeacher ? 'Teaching' : 'Learning'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          With {peer?.name} • {new Date(session.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({session.duration} mins)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {Boolean(session.meeting?.meetingUri || session.meetingUri) && (
                        <a
                          href={session.meeting?.meetingUri || session.meetingUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Google Meet
                        </a>
                      )}
                      <button
                        onClick={() => onNavigate('sessions', { sessionId: session.id })}
                        className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                      >
                        Workspace
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Recent Activity Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Recent Activity</h3>
          {realActivities.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No recent activity yet</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Connect with peers and schedule learning sessions to track your collaborative milestones here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              {realActivities.map((act) => {
                const Icon = act.icon;
                const colorClasses = act.color === 'emerald'
                  ? 'bg-emerald-100 text-emerald-700'
                  : act.color === 'brand'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-indigo-100 text-indigo-700';

                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full ${colorClasses} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{act.title}</p>
                      <p className="text-slate-500 text-[11px]">{act.description}</p>
                      <span className="text-[10px] text-slate-400">{act.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Connect Modal */}
      {selectedStudentForConnect && (
        <ConnectModal
          isOpen={Boolean(selectedStudentForConnect)}
          onClose={() => setSelectedStudentForConnect(null)}
          targetUser={selectedStudentForConnect}
          onSent={() => setSelectedStudentForConnect(null)}
        />
      )}

    </div>
  );
}
