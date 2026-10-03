import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Video, 
  Award, 
  BookOpen, 
  ShieldCheck, 
  Repeat, 
  Star,
  ChevronRight,
  Zap,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MatchBadge, SkillTag } from '../components/common/Badge';

export default function LandingPage({ onNavigate, onOpenAuth }) {
  const { currentUser, isFirebaseLive } = useAuth();

  const handleAction = (mode = 'login') => {
    if (currentUser) {
      onNavigate('dashboard');
    } else if (onOpenAuth) {
      onOpenAuth(mode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Skill<span className="text-brand-600">Sync</span></span>
              <p className="text-[10px] text-slate-400 font-medium">Learn • Teach • Grow Together</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
              >
                <span>Dashboard ({currentUser.name?.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAction('login')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => handleAction('signup')}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <span>Join SkillSync</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            <span>The Peer-to-Peer College Skill Exchange Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Learn from the right people. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Share what you know.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            SkillSync connects students with peers who can teach the skills they want to learn — and helps turn those connections into real, scheduled Google Meet learning sessions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={() => handleAction('signup')}
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4" />
              <span>{currentUser ? 'Find a Skill to Learn' : 'Get Started with Google'}</span>
            </button>

            <button
              onClick={() => handleAction('login')}
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>{currentUser ? 'Go to Dashboard' : 'Sign In with Email'}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-1">
            ⚡ Real Firebase Authentication • Guaranteed Real Google Meet rooms • Verified student reviews
          </p>
        </div>
      </section>

      {/* Interactive Example Match Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Smart Compatibility Engine</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Real Bilateral Matching In Action
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              SkillSync doesn't just match keywords. It identifies two students who can help each other and explains exactly why they belong in a session.
            </p>
          </div>

          {/* Example Match Box */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
              
              {/* Student A (Manideep) */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex-1 w-full">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
                  alt="Manideep"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-100"
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700">Student A</span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-0.5">Manideep Reddy</h3>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    <p>🎯 <strong>Wants to Learn:</strong> Python, Flask</p>
                    <p>💡 <strong>Can Teach:</strong> UI/UX, Figma</p>
                  </div>
                </div>
              </div>

              {/* Match Score Center Badge */}
              <div className="flex flex-col items-center justify-center px-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-100">
                  98%
                </div>
                <span className="text-xs font-extrabold text-emerald-700 mt-1.5 uppercase tracking-wider">Perfect Match</span>
              </div>

              {/* Student B (Rahul) */}
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex-1 w-full">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                  alt="Rahul"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-100"
                />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">Student B</span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-0.5">Rahul Sharma</h3>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    <p>🎯 <strong>Wants to Learn:</strong> UI/UX, Figma</p>
                    <p>💡 <strong>Can Teach:</strong> Python, Flask, SQL</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Why You Match Checklist */}
            <div className="pt-6">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                Why this is a 98% Match:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  "✓ Rahul teaches Python & Flask",
                  "✓ Manideep wants to learn Python",
                  "✓ Manideep teaches UI/UX & Figma",
                  "✓ Overlapping weekday evenings"
                ].map((reason, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => handleAction('login')}
                className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <span>{currentUser ? 'Find Skills in App' : 'Sign in to Connect with Rahul'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Simple 4-Step Loop</span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">How SkillSync Works</h2>
          <p className="text-sm text-slate-500">From finding the right peer to conducting a genuine 1-on-1 Google Meet session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Create your student account",
              desc: "Sign in with Google, set the skills you want to learn, and the skills you can share."
            },
            {
              step: "02",
              title: "Discover mutual matches",
              desc: "Our matching algorithm calculates compatibility and explains exactly why you fit."
            },
            {
              step: "03",
              title: "Connect and real-time chat",
              desc: "Send a learning request, start chatting in real time, and agree on a session time."
            },
            {
              step: "04",
              title: "Meet and grow together",
              desc: "Launch a real Google Meet room with one click, earn credits, and build your reputation."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative space-y-3">
              <span className="text-3xl font-black text-brand-200 block">{item.step}</span>
              <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why SkillSync Features */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Built for College Students</span>
            <h2 className="text-3xl font-black tracking-tight">Why SkillSync?</h2>
            <p className="text-sm text-slate-400">Why passive video tutorials and random chat groups fall short.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Peer-to-Peer Learning",
                desc: "Learn directly from students who recently mastered the subject and understand the exact challenges."
              },
              {
                title: "Real Google Meet Sessions",
                desc: "No fake video players. Scheduled sessions generate real Google Meet rooms with agenda checklists."
              },
              {
                title: "Credits & Reputation",
                desc: "Earn +20 credits every time you teach, build a verified 5-star profile, and collect skill badges."
              }
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-2">
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-12 bg-white border-t border-slate-200 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900">Ready to start exchanging skills?</h3>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleAction('signup')}
              className="py-3 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all"
            >
              {currentUser ? 'Open Dashboard' : 'Join with Google'}
            </button>
            <button
              onClick={() => handleAction('login')}
              className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all"
            >
              {currentUser ? 'Discover Peers' : 'Student Sign In'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 pt-4">
            SkillSync • Multi-User Peer Skill Exchange • Real-Time Google Meet Integration
          </p>
        </div>
      </footer>

    </div>
  );
}
