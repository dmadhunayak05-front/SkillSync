import React from 'react';
import { Sparkles, Calendar, ArrowRight, Video, Target } from 'lucide-react';

export default function GoalProgressCard({ currentUser, nextSession, onNavigate }) {
  const targetSkill = currentUser?.skillsToLearn?.[0] || currentUser?.skillsToTeach?.[0] || 'Skills';
  const progressPercent = currentUser?.sessionsCompleted ? Math.min(100, currentUser.sessionsCompleted * 10) : 65;
  const totalSkillsCount = (currentUser?.skillsToTeach?.length || 0) + (currentUser?.skillsToLearn?.length || 0);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-900/10">
      <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-20 top-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left Side: Welcome Greeting */}
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Active Goal: Master {targetSkill}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Good day, {currentUser?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Welcome to your peer exchange dashboard. Connect with college peers, exchange mentorship, and launch real Google Meet learning calls.
          </p>

          {/* Quick Mini Stats row */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 max-w-md">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-semibold block">Goal Progress</span>
              <span className="text-base font-extrabold text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-semibold block">Active Skills</span>
              <span className="text-base font-extrabold text-white">{totalSkillsCount} listed</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 font-semibold block">Next Session</span>
              <span className="text-base font-extrabold text-amber-400">
                {nextSession ? 'Scheduled' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Next Scheduled Session / Continue Card */}
        <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Upcoming Live Session
            </span>
            <span className={`w-2 h-2 rounded-full ${nextSession ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          </div>

          {nextSession ? (
            <div>
              <p className="font-extrabold text-base text-white">{nextSession.title || `${nextSession.skill} Session`}</p>
              <p className="text-xs text-slate-300 mt-0.5">
                {new Date(nextSession.scheduledAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(nextSession.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="mt-3.5 flex items-center gap-2">
                {Boolean(nextSession.meeting?.meetingUri || nextSession.meetingUri) ? (
                  <a
                    href={nextSession.meeting?.meetingUri || nextSession.meetingUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Join Google Meet
                  </a>
                ) : (
                  <button
                    onClick={() => onNavigate('sessions')}
                    className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    View Session
                  </button>
                )}
                <button
                  onClick={() => onNavigate('sessions', { sessionId: nextSession.id })}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-bold text-sm text-white">No upcoming sessions today</p>
              <p className="text-xs text-slate-300 mt-0.5">Connect with a peer or schedule your next session.</p>
              <button
                onClick={() => onNavigate('discover')}
                className="w-full mt-3 py-2 px-3 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-100 transition-colors"
              >
                <span>Find a Skill Partner</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
