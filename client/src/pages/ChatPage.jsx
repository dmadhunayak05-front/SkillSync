import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import ChatWindow from '../components/chat/ChatWindow';
import { MessageSquare, Users, Sparkles, ArrowRight } from 'lucide-react';

export default function ChatPage({ connectionId: initialConnId, onNavigate }) {
  const { currentUser, allUsers } = useAuth();
  const { connections } = useSync();

  const userConnections = connections.filter(c => c.userIds.includes(currentUser?.uid));
  const [selectedConnId, setSelectedConnId] = useState(
    initialConnId || userConnections[0]?.id || null
  );

  useEffect(() => {
    if (initialConnId) {
      setSelectedConnId(initialConnId);
    } else if (!selectedConnId && userConnections.length > 0) {
      setSelectedConnId(userConnections[0].id);
    }
  }, [initialConnId, userConnections]);

  return (
    <div className="space-y-4 pb-8">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Real-Time Peer Chat</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Direct Messages & Learning Rooms
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Coordinate topics, discuss homework questions, and schedule genuine Google Meet calls.
        </p>
      </div>

      {userConnections.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">No active chats yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Connect with a student from the Discover page to unlock real-time chat and Google Meet scheduling!
          </p>
          <button
            onClick={() => onNavigate('discover')}
            className="py-2.5 px-5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors"
          >
            Find a Skill Partner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Left Column: Connections List (Hidden on mobile if chat is active) */}
          <div className={`lg:block ${selectedConnId ? 'hidden sm:block' : 'block'} lg:col-span-1 bg-white rounded-3xl p-4 border border-slate-200 shadow-sm h-[calc(100vh-14rem)] overflow-y-auto space-y-2`}>
            <div className="px-2 py-1 mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Peers</span>
            </div>

            {userConnections.map((conn) => {
              const peerId = conn.userIds.find(id => id !== currentUser?.uid);
              const peer = allUsers.find(u => u.uid === peerId);
              const isSelected = conn.id === selectedConnId;

              return (
                <button
                  key={conn.id}
                  onClick={() => setSelectedConnId(conn.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                    isSelected 
                      ? 'bg-brand-50 border border-brand-200 shadow-xs' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={peer?.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-brand-900' : 'text-slate-900'}`}>
                        {peer?.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {conn.lastMessageAt ? new Date(conn.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {conn.lastMessage || 'Connected! Say hello.'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Chat Window */}
          <div className="lg:col-span-3">
            {selectedConnId ? (
              <ChatWindow
                connectionId={selectedConnId}
                onBack={() => setSelectedConnId(null)}
                onNavigate={onNavigate}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center h-[calc(100vh-14rem)] flex flex-col items-center justify-center space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Select a peer to open real-time chat</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
