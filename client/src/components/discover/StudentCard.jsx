import React from 'react';
import { MatchBadge, SkillTag } from '../common/Badge';
import { Star, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function StudentCard({ student, matchResult, onConnect, onViewProfile }) {
  const score = matchResult?.score || 85;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 hover:border-brand-300 shadow-sm hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={student.photoURL}
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-brand-400 transition-all"
            />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                {student.name}
              </h3>
              <p className="text-xs text-slate-500">{student.college} • {student.year}</p>
            </div>
          </div>
          <MatchBadge score={score} />
        </div>

        {/* Rating & Sessions */}
        <div className="flex items-center gap-3 mb-3.5 text-xs text-slate-500">
          <div className="flex items-center gap-1 font-bold text-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{student.rating?.toFixed(1) || '4.8'}</span>
            <span className="text-slate-400 font-normal">({student.reviewCount || 10})</span>
          </div>
          <span>•</span>
          <span>{student.sessionsCompleted || 12} sessions</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">{student.credits || 50} pts</span>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {student.bio}
        </p>

        {/* Skills Section */}
        <div className="space-y-2.5 mb-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Can Teach
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(student.skillsToTeach || []).slice(0, 3).map((s) => (
                <SkillTag key={s} skill={s} type="teach" />
              ))}
              {(student.skillsToTeach || []).length > 3 && (
                <span className="text-[10px] font-semibold text-slate-400 self-center">
                  +{student.skillsToTeach.length - 3}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Wants to Learn
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(student.skillsToLearn || []).slice(0, 3).map((s) => (
                <SkillTag key={s} skill={s} type="learn" />
              ))}
            </div>
          </div>
        </div>

        {/* Why this match mini pill */}
        {matchResult?.reasons?.[0] && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-4 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-slate-600 line-clamp-1">
              {matchResult.reasons[0].text}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onViewProfile(student.uid)}
          className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors text-center"
        >
          View Profile
        </button>
        <button
          onClick={() => onConnect(student)}
          className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 transition-all"
        >
          <span>Connect</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
