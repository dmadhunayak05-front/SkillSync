import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { SkillTag } from '../components/common/Badge';
import { 
  Star, 
  Award, 
  Calendar, 
  Clock, 
  BookOpen, 
  ShieldCheck, 
  Edit3, 
  Sparkles,
  Users
} from 'lucide-react';

export default function MyProfilePage({ onNavigate }) {
  const { currentUser } = useAuth();
  const { sessions, connections, feedback } = useSync();

  const userSessions = sessions.filter(
    s => s.learnerId === currentUser?.uid || s.teacherId === currentUser?.uid
  );
  const completed = userSessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={currentUser?.photoURL}
            alt=""
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-slate-100 shadow-sm"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{currentUser?.name}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Student
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              {currentUser?.course || 'Computer Science'} • {currentUser?.year || '2nd Year'} • {currentUser?.college || 'University'}
            </p>
            <div className="flex items-center gap-3 text-xs pt-1">
              <div className="flex items-center gap-1 font-bold text-slate-900">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{currentUser?.rating?.toFixed(1) || '4.9'}</span>
                <span className="text-slate-400 font-normal">({currentUser?.reviewCount || 9} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">{currentUser?.sessionsCompleted || 9} Sessions Completed</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('onboarding')}
          className="self-start md:self-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile & Skills</span>
        </button>
      </div>

      {/* Credits & Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg shadow-slate-900/10">
          <span className="text-xs text-slate-400 block mb-1">Available Credits</span>
          <span className="text-3xl font-black text-emerald-400">{currentUser?.credits || 60}</span>
          <span className="text-[10px] text-slate-400 block mt-1">+20 per session taught</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Sessions Taught</span>
          <span className="text-3xl font-black text-slate-900">{currentUser?.sessionsTaught || 6}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Peer mentorship calls</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Sessions Learned</span>
          <span className="text-3xl font-black text-slate-900">{currentUser?.sessionsLearned || 3}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Knowledge gained</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Study Connections</span>
          <span className="text-3xl font-black text-slate-900">{connections.length}</span>
          <span className="text-[10px] text-slate-400 block mt-1">In your network</span>
        </div>
      </div>

      {/* Grid: Skills Left, Availability & Badges Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Skills & Bio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">About Me</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {currentUser?.bio || "Product designer and frontend enthusiast. Seeking a peer to mentor me through Python backend development."}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-extrabold text-slate-900">My Skills</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Skills I Can Teach
                </span>
                <div className="flex flex-wrap gap-2">
                  {(currentUser?.skillsToTeach || []).map((s) => (
                    <SkillTag key={s} skill={s} type="teach" />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Skills I Want To Learn
                </span>
                <div className="flex flex-wrap gap-2">
                  {(currentUser?.skillsToLearn || []).map((s) => (
                    <SkillTag key={s} skill={s} type="learn" />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Interests
                </span>
                <div className="flex flex-wrap gap-2">
                  {(currentUser?.interests || []).map((interest) => (
                    <span key={interest} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Availability & Badges */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              My Availability Slots
            </h3>
            <div className="space-y-2">
              {(currentUser?.availability || ["Monday 5 PM - 8 PM", "Tuesday 5 PM - 8 PM"]).map((slot, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>{slot}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Badges Earned
            </h3>
            <div className="space-y-2.5">
              {(currentUser?.badges || ['Design Specialist', 'Active Learner']).map((b) => (
                <div key={b} className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center gap-3">
                  <span className="text-lg">🎖️</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{b}</h5>
                    <p className="text-[10px] text-slate-500">Verified Achievement</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
