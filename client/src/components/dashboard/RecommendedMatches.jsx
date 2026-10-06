import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MatchBadge, SkillTag } from '../common/Badge';
import { Sparkles, ArrowRight, Star, CheckCircle2, UserCheck } from 'lucide-react';

export default function RecommendedMatches({ matches, onConnect, onViewProfile, onNavigate }) {
  const { currentUser } = useAuth();
  const topMatches = matches.slice(0, 3);
  const needsProfileCompletion = (currentUser?.skillsToTeach?.length || 0) === 0 && (currentUser?.skillsToLearn?.length || 0) === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Recommended for you</span>
            <span className="w-2 h-2 rounded-full bg-brand-500" />
          </h2>
          <p className="text-xs text-slate-500">
            Curated peer matches based on your active learning goals & mutual exchange potential.
          </p>
        </div>
        <button
          onClick={() => onNavigate('discover')}
          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
        >
          <span>View all matches</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Profile completion notice if skills are not yet listed */}
      {needsProfileCompletion && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-brand-950">Complete your profile to improve your matches</p>
              <p className="text-[11px] text-brand-700">Add the skills you want to learn and share to unlock higher-accuracy compatibility scores.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('onboarding')}
            className="py-1.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex-shrink-0 shadow-xs transition-colors"
          >
            Add Skills
          </button>
        </div>
      )}

      {topMatches.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No other registered peers yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once other students register and complete their profiles, they will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topMatches.map(({ user, score, reasons, breakdown }) => (
          <div
            key={user.uid}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-card-hover transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-brand-400 transition-all"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
                      {user.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{user.college}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{user.rating?.toFixed(1) || '4.8'}</span>
                      <span className="text-slate-400 font-normal text-[10px]">({user.reviewCount || 10})</span>
                    </div>
                  </div>
                </div>
                <MatchBadge score={score} />
              </div>

              {/* Skills */}
              <div className="space-y-2 mb-3.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Can Teach
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(user.skillsToTeach || []).slice(0, 3).map((s) => (
                      <SkillTag key={s} skill={s} type="teach" />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Wants To Learn
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(user.skillsToLearn || []).slice(0, 2).map((s) => (
                      <SkillTag key={s} skill={s} type="learn" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Why Match Highlight */}
              {reasons?.[0] && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {reasons[0].text}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => onViewProfile(user.uid)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Why this match?
              </button>
              <button
                onClick={() => onConnect(user)}
                className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <span>Connect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
