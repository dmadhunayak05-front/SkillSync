import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { calculateMatch } from '../utils/matching';
import WhyThisMatchCard from '../components/profile/WhyThisMatchCard';
import ConnectModal from '../components/discover/ConnectModal';
import ScheduleModal from '../components/sessions/ScheduleModal';
import { MatchBadge, SkillTag } from '../components/common/Badge';
import { 
  Star, 
  Award, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  MessageSquare, 
  ArrowLeft,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function ProfilePage({ userId, onNavigate }) {
  const { currentUser, allUsers } = useAuth();
  const { connections } = useSync();

  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const student = allUsers.find(u => u.uid === userId) || allUsers[0];
  const isMe = currentUser?.uid === student.uid;

  // Check if connected
  const existingConn = connections.find(c => 
    c.userIds.includes(currentUser?.uid) && c.userIds.includes(student.uid)
  );

  const matchResult = calculateMatch(currentUser, student);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Back button */}
      <button
        onClick={() => onNavigate('discover')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Discover</span>
      </button>

      {/* Main Profile Header Card (Inspired by Reference Images 1 & 3) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={student.photoURL}
              alt={student.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-slate-100 shadow-sm"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{student.name}</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
                </span>
                <MatchBadge score={matchResult.score} />
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-600">
                {student.course} • {student.year} • {student.college}
              </p>

              {/* Rating & Sessions */}
              <div className="flex items-center gap-3 text-xs pt-1">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{student.rating?.toFixed(1) || '4.8'}</span>
                  <span className="text-slate-400 font-normal">({student.reviewCount || 12} reviews)</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">{student.sessionsCompleted || 12} Sessions Completed</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {student.credits || 80} Credits
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {!isMe && (
            <div className="flex items-center gap-3">
              {existingConn ? (
                <>
                  <button
                    onClick={() => onNavigate('chat', { connectionId: existingConn.id })}
                    className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-600" />
                    <span>Open Chat</span>
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="py-3 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Session</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Learning Request</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* "Why this person?" Intelligence Card (Section 11, 39 & Reference Images) */}
      <WhyThisMatchCard matchResult={matchResult} peerName={student.name} />

      {/* Grid: About & Skills Left, Availability & Badges Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">About {student.name}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {student.bio}
            </p>
          </div>

          {/* Skills Grid */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-extrabold text-slate-900">Skills & Knowledge Track</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Skills They Can Teach
                </span>
                <div className="flex flex-wrap gap-2">
                  {(student.skillsToTeach || []).map((s) => (
                    <SkillTag key={s} skill={s} type="teach" />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Skills They Want to Learn
                </span>
                <div className="flex flex-wrap gap-2">
                  {(student.skillsToLearn || []).map((s) => (
                    <SkillTag key={s} skill={s} type="learn" />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Interests & Focus Areas
                </span>
                <div className="flex flex-wrap gap-2">
                  {(student.interests || []).map((interest) => (
                    <span key={interest} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Student Reviews & Verified Feedback */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
              <span>Peer Reviews & Feedback</span>
              <span className="text-xs font-normal text-slate-500">Verified sessions</span>
            </h3>

            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Manideep Reddy</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">5.0</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  "Explained Flask routing and virtual environment setup so clearly. We built our first live endpoints within 30 minutes!"
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">Python Mentorship Session</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">Ananya Sharma</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">5.0</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  "Super patient mentor! Helped me understand SQL relations and how to connect database models."
                </p>
                <span className="text-[10px] text-slate-400 block pt-1">Backend Engineering Track</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Availability & Badges */}
        <div className="space-y-6">
          
          {/* Availability Card (Inspired by Reference Images 1 & 3) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              Weekly Availability
            </h3>
            <p className="text-xs text-slate-500">
              Pick a slot that fits your schedule for a focused 1-on-1 session.
            </p>

            <div className="space-y-2.5">
              {(student.availability || [
                "Monday 5 PM - 8 PM",
                "Tuesday 5 PM - 8 PM",
                "Thursday 5 PM - 8 PM",
                "Saturday 10 AM - 1 PM"
              ]).map((slot, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>{slot}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Open</span>
                </div>
              ))}
            </div>

            {!isMe && (
              <button
                onClick={() => existingConn ? setShowScheduleModal(true) : setShowConnectModal(true)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{existingConn ? "Schedule in this window" : "Request this schedule"}</span>
              </button>
            )}
          </div>

          {/* Badges & Achievements */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Reputation Badges
            </h3>

            <div className="space-y-2.5">
              {(student.badges || ['Helpful Peer', 'Knowledge Sharer']).map((badge) => (
                <div key={badge} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                    🏆
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{badge}</h5>
                    <p className="text-[10px] text-slate-500">Verified peer-reviewed credential</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <ConnectModal
          isOpen={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          targetUser={student}
          onSent={() => setShowConnectModal(false)}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          peerUser={student}
          preselectedSkill={student.skillsToTeach?.[0]}
          onScheduled={() => {
            setShowScheduleModal(false);
            onNavigate('sessions');
          }}
        />
      )}

    </div>
  );
}
