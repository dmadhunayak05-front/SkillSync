import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { 
  Send, 
  Video, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  ArrowLeft, 
  Check, 
  Clock 
} from 'lucide-react';
import ScheduleModal from '../sessions/ScheduleModal';

export default function ChatWindow({ connectionId, onBack, onNavigate }) {
  const { currentUser, allUsers } = useAuth();
  const { connections, messages, sendMessage } = useSync();

  const [text, setText] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const messagesEndRef = useRef(null);

  const connection = connections.find(c => c.id === connectionId);
  const peerId = connection?.userIds.find(id => id !== currentUser?.uid);
  const peer = allUsers.find(u => u.uid === peerId) || connection?.peer || (connection?.user1?.uid === peerId ? connection?.user1 : connection?.user2) || {
    uid: peerId,
    name: (connection?.user1?.uid === peerId ? connection?.user1?.name : connection?.user2?.name) || 'Peer Student',
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerId || 'peer'}`,
    skillsToTeach: ['General Knowledge'],
    rating: 5.0
  };

  const connectionMessages = messages[connectionId] || [];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [connectionMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msgText = text;
    setText('');
    await sendMessage(connectionId, msgText);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-8.5rem)] overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <img src={peer.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>{peer.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ⭐ {peer.rating?.toFixed(1) || '4.8'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {peer.skillsToTeach?.length > 0 ? `Teaches: ${peer.skillsToTeach.slice(0, 2).join(', ')}` : peer.college}
            </p>
          </div>
        </div>

        {/* Schedule Session Header Action */}
        <button
          onClick={() => setShowScheduleModal(true)}
          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Schedule Session</span>
          <span className="sm:hidden">Meet</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30">
        
        {/* Encrypted & Realtime indicator */}
        <div className="text-center py-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200/60 shadow-xs">
            <Sparkles className="w-3 h-3 text-brand-500" />
            Connected for peer skill exchange • Real-time active
          </span>
        </div>

        {connectionMessages.map((msg) => {
          const isMe = msg.senderId === currentUser?.uid;
          const isMeetMessage = msg.text.includes('meet.google.com');

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-xs ${
                  isMe
                    ? 'bg-brand-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                }`}
              >
                {/* Regular text */}
                <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>

                {/* If contains Google Meet URL, render embedded 1-click Join Button! */}
                {isMeetMessage && (
                  <div className="mt-3 pt-2.5 border-t border-white/20 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-emerald-200 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" />
                      Google Meet Conference Ready
                    </span>
                    <a
                      href={msg.text.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i)?.[0] || 'https://meet.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Google Meet Call
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          className="p-2.5 rounded-xl text-brand-600 hover:bg-brand-50 border border-brand-200 transition-colors hidden sm:flex items-center gap-1.5 text-xs font-bold"
          title="Schedule Session"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule</span>
        </button>

        <input
          type="text"
          placeholder={`Message ${peer.name}... (e.g. "Can we learn Python tomorrow at 5?")`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 transition-all"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          peerUser={peer}
          preselectedSkill={peer.skillsToTeach?.[0]}
          onScheduled={() => {
            setShowScheduleModal(false);
          }}
        />
      )}
    </div>
  );
}
