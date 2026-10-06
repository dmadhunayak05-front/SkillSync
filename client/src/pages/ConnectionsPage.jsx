import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { 
  Users, 
  Check, 
  X, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  Clock, 
  ArrowRight 
} from 'lucide-react';
import ScheduleModal from '../components/sessions/ScheduleModal';

export default function ConnectionsPage({ onNavigate }) {
  const { currentUser, allUsers } = useAuth();
  const { requests, connections, respondToConnectionRequest } = useSync();

  const [activeTab, setActiveTab] = useState('received'); // 'received', 'connections', 'sent'
  const [schedulingPeer, setSchedulingPeer] = useState(null);

  // Filter requests
  const receivedRequests = requests.filter(r => r.receiverId === currentUser?.uid && r.status === 'pending');
  const sentRequests = requests.filter(r => r.senderId === currentUser?.uid);
  
  // Filter user's active connections
  const userConnections = connections.filter(c => c.userIds && c.userIds.includes(currentUser?.uid));

  // [CONNECTIONS DEBUG] Logging required by Section 10
  React.useEffect(() => {
    if (!currentUser?.uid) return;
    console.log('=== [CONNECTIONS DEBUG] ===');
    console.log('authUid:', currentUser.uid);
    console.log('authEmail:', currentUser.email);
    console.log('name:', currentUser.name);
    console.log('Number of received requests:', receivedRequests.length);
    console.log('Number of active connections:', userConnections.length);
    console.log('===========================');
  }, [currentUser?.uid, currentUser?.email, currentUser?.name, receivedRequests.length, userConnections.length]);

  const handleAccept = async (requestId) => {
    await respondToConnectionRequest(requestId, 'accepted');
  };

  const handleDecline = async (requestId) => {
    await respondToConnectionRequest(requestId, 'rejected');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <Users className="w-3.5 h-3.5" />
          <span>Peer Network</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Learning Connections & Requests
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your incoming skill exchange requests and active study partners.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('received')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all relative ${
            activeTab === 'received'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Received Requests</span>
          {receivedRequests.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white text-brand-700 text-[10px] font-extrabold">
              {receivedRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('connections')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'connections'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Active Connections ({userConnections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sent')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sent'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Sent Requests ({sentRequests.length})</span>
        </button>
      </div>

      {/* 1. Received Requests Tab */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No pending received requests</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When other students discover your skills and want to learn from you, their requests will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receivedRequests.map((req) => {
                const sender = allUsers.find(u => u.uid === req.senderId) || req.sender || {
                  name: req.senderName || 'Student',
                  photoURL: req.senderPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.senderId}`,
                  college: req.senderCollege || 'Tech University',
                  course: 'Student',
                  rating: 5.0
                };
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border border-brand-100 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img src={sender?.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{sender?.name}</h4>
                        <p className="text-xs text-slate-500">{sender?.college} • {sender?.course}</p>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5 inline-block">
                          ⭐ {sender?.rating?.toFixed(1) || '4.9'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <p className="font-semibold text-slate-900 mb-1">
                        🎯 Wants to learn: <span className="text-brand-600">{req.skillRequested}</span>
                      </p>
                      <p className="font-semibold text-slate-900 mb-2">
                        💡 Offers to teach: <span className="text-emerald-600">{req.skillOffered}</span>
                      </p>
                      <p className="italic text-slate-600">"{req.message}"</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Accept & Connect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Active Connections Tab */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          {userConnections.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No active connections yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore the discover page to find students and send your first learning request!
              </p>
              <button
                onClick={() => onNavigate('discover')}
                className="py-2.5 px-5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
              >
                Discover Skills & Students
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userConnections.map((conn) => {
                const peerId = conn.userIds?.find(id => id !== currentUser?.uid);
                const peer = allUsers.find(u => u.uid === peerId) || conn.peer || (conn.user1?.uid === peerId ? conn.user1 : conn.user2) || {
                  uid: peerId,
                  name: (conn.user1?.uid === peerId ? conn.user1?.name : conn.user2?.name) || 'Connected Partner',
                  photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId}`,
                  college: 'SkillSync Network',
                  skillsToTeach: ['Knowledge Exchange'],
                  skillsToLearn: ['General Learning']
                };

                return (
                  <div
                    key={conn.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <img src={peer?.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">{peer?.name}</h4>
                          <p className="text-xs text-slate-500">{peer?.college}</p>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                            Connected Partner
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <p><strong>Teaches:</strong> {(peer?.skillsToTeach || []).slice(0, 3).join(', ')}</p>
                        <p><strong>Learning:</strong> {(peer?.skillsToLearn || []).slice(0, 2).join(', ')}</p>
                      </div>

                      {conn.lastMessage && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 line-clamp-2">
                          "{conn.lastMessage}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => onNavigate('chat', { connectionId: conn.id })}
                        className="flex-1 py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </button>
                      <button
                        onClick={() => setSchedulingPeer(peer)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Schedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-2">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900">No sent requests pending</h3>
              <p className="text-xs text-slate-500">You haven't sent any learning requests yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentRequests.map((req) => {
                const receiver = allUsers.find(u => u.uid === req.receiverId) || req.receiver || {
                  name: req.receiverName || 'Student',
                  photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.receiverId}`,
                  college: 'Tech University'
                };
                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={receiver?.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{receiver?.name}</h4>
                          <p className="text-[11px] text-slate-500">{receiver?.college}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'accepted' ? 'Accepted' : 'Pending Review'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{req.message}"
                    </p>

                    {req.status === 'accepted' && (
                      <button
                        onClick={() => onNavigate('chat')}
                        className="w-full py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
                      >
                        Open Chat
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {schedulingPeer && (
        <ScheduleModal
          isOpen={Boolean(schedulingPeer)}
          onClose={() => setSchedulingPeer(null)}
          peerUser={schedulingPeer}
          preselectedSkill={schedulingPeer?.skillsToTeach?.[0]}
          onScheduled={() => {
            setSchedulingPeer(null);
            onNavigate('sessions');
          }}
        />
      )}

    </div>
  );
}
