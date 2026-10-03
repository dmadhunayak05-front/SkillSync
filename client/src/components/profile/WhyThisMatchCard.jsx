import React from 'react';
import { 
  CheckCircle2, 
  Repeat, 
  Target, 
  Clock, 
  Sparkles, 
  Award, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { MatchBadge } from '../common/Badge';

export default function WhyThisMatchCard({ matchResult, peerName = 'This peer' }) {
  if (!matchResult) return null;

  const { score, reasons = [], breakdown = {} } = matchResult;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Top Match Intelligence</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> High Compatibility
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Why this person?</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Key signals and algorithmic factors explaining why {peerName} is a strong peer match for you.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Match score</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight">{score}%</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 p-0.5 shadow-md shadow-brand-500/10">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-brand-600 text-sm">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Reason Cards (Inspired by Reference Images 1 & 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. Skill Match */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Skill match</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {matchResult.directSkills?.length > 0 
                ? `Teaches ${matchResult.directSkills.join(', ')} which matches your learning goals.`
                : 'Aligned on core syllabus and foundational tools.'}
            </p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 mt-3 inline-block">✓ Direct overlap</span>
        </div>

        {/* 2. Reciprocal / Beginner-friendly */}
        <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100/80 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-3">
              <Repeat className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Two-way exchange</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              {matchResult.reciprocalSkills?.length > 0 
                ? `Wants to learn ${matchResult.reciprocalSkills.join(', ')} from you. A win-win swap!`
                : 'Mutual interest in project collaboration.'}
            </p>
          </div>
          <span className="text-[10px] font-bold text-brand-700 mt-3 inline-block">✓ Mutual value</span>
        </div>

        {/* 3. Relevant experience */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Relevant experience</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Active peer with high mentor rating and verified practical coursework.
            </p>
          </div>
          <span className="text-[10px] font-bold text-indigo-700 mt-3 inline-block">✓ 4.8+ Rating</span>
        </div>

        {/* 4. Availability */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/80 flex flex-col justify-between">
          <div>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Schedule overlap</h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              Both active during weekday evenings (5:00 PM – 8:00 PM) for 1-on-1 calls.
            </p>
          </div>
          <span className="text-[10px] font-bold text-amber-700 mt-3 inline-block">✓ Ready to meet</span>
        </div>

      </div>

      {/* Match Strength Breakdown Progress Bars */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Compatibility Dimension Scores
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Skill Overlap</span>
              <span className="font-bold text-emerald-600">{breakdown.skillOverlap || 94}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${breakdown.skillOverlap || 94}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Reciprocal Fit</span>
              <span className="font-bold text-brand-600">{breakdown.reciprocalFit || 88}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                style={{ width: `${breakdown.reciprocalFit || 88}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Availability Overlap</span>
              <span className="font-bold text-indigo-600">{breakdown.availabilityMatch || 96}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${breakdown.availabilityMatch || 96}%` }} 
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span>Learning Style Compatibility</span>
              <span className="font-bold text-amber-600">{breakdown.interestMatch || 90}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${breakdown.interestMatch || 90}%` }} 
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
