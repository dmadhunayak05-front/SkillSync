import React, { useState, useEffect } from 'react';
import { 
  Video, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  Send, 
  MessageSquare,
  Sparkles,
  Award
} from 'lucide-react';

export default function LiveMeetingWorkspace({ session, peerUser, onCompleteSession, onOpenFeedback }) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([0]);
  const [notes, setNotes] = useState('');
  const [pollAnswered, setPollAnswered] = useState(false);

  // Agenda steps
  const steps = session?.agenda?.length > 0 ? session.agenda : [
    'Initial greetings & learning roadmap overview',
    'Hands-on live screen share walkthrough',
    'Guided code review and peer Q&A',
    'Wrap-up, assignments, and resource exchange'
  ];

  const toggleStep = (idx) => {
    if (completedSteps.includes(idx)) {
      setCompletedSteps(completedSteps.filter(i => i !== idx));
    } else {
      setCompletedSteps([...completedSteps, idx]);
    }
  };

  const progressPercent = Math.round((completedSteps.length / steps.length) * 100);
  const meetUri = session?.meeting?.meetingUri || session?.meetingUri;

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Inspired by Reference Image 4) */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Session Active
              </span>
              <span className="text-xs text-slate-400">Duration: {session?.duration || 45} mins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {session?.title || `${session?.skill} 1-on-1 Session`}
            </h1>
            <p className="text-sm text-slate-300">
              Live collaboration with <strong>{peerUser?.name}</strong> • Follow along the agenda or jump into the real Google Meet call.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {Boolean(meetUri) && (
              <a
                href={meetUri}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02]"
              >
                <Video className="w-5 h-5" />
                <span>Join Google Meet</span>
                <ExternalLink className="w-4 h-4 opacity-75" />
              </a>
            )}

            {session?.status !== 'completed' ? (
              <button
                onClick={() => onCompleteSession(session.id)}
                className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 transition-all"
              >
                Mark Completed
              </button>
            ) : (
              <button
                onClick={onOpenFeedback}
                className="py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-sm shadow-md transition-all"
              >
                Give Feedback
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Left Agenda & Steps, Right Meeting Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Step-by-step Interactive Agenda */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Interactive Session Agenda</h3>
                <p className="text-xs text-slate-500 mt-0.5">Check off milestones as you and {peerUser?.name} progress.</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-brand-600">{progressPercent}% complete</span>
                <div className="w-28 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const isDone = completedSteps.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isDone 
                        ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950' 
                        : 'bg-slate-50/70 border-slate-200 hover:border-brand-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isDone ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-600'
                    }`}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                        {step}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Estimated ~{Math.round((session?.duration || 45) / steps.length)} mins
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Check / Poll */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Quick Progress Check</h4>
            <p className="text-sm font-semibold text-slate-800">
              Are you and {peerUser?.name} able to see the shared screen and execute code?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPollAnswered(true)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  pollAnswered 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {pollAnswered ? '✓ Yes, all clear!' : 'Yes, all clear!'}
              </button>
              {Boolean(meetUri) && (
                <a
                  href={meetUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 font-bold hover:underline"
                >
                  Need to re-enter meeting?
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Session Card & Resource links */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Session Details</h3>

            <div className="flex items-center gap-3">
              <img src={peerUser?.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-slate-900">{peerUser?.name}</p>
                <p className="text-xs text-slate-500">{peerUser?.college}</p>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                  ⭐ {peerUser?.rating?.toFixed(1) || '4.8'} rating
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Skill Track</span>
                <span className="font-bold text-slate-800">{session?.skill}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Scheduled</span>
                <span className="font-semibold text-slate-800">
                  {new Date(session?.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(session?.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Platform</span>
                <span className="font-bold text-emerald-600">Google Meet</span>
              </div>
            </div>

            {Boolean(meetUri) && (
              <a
                href={meetUri}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <Video className="w-3.5 h-3.5" />
                Open Real Google Meet
              </a>
            )}
          </div>

          {/* Quick Scratchpad */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Session Notes</h4>
            <textarea
              rows={4}
              placeholder="Jot down links, snippet commands, or homework questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
