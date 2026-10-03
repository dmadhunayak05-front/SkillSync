import React from 'react';

export function MatchBadge({ score }) {
  let color = 'bg-brand-50 text-brand-700 border-brand-200';
  if (score >= 90) {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (score >= 75) {
    color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wide border shadow-sm ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {score}% Match
    </span>
  );
}

export function SkillTag({ skill, type = 'teach' }) {
  if (type === 'teach') {
    return (
      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
        {skill}
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200">
      {skill}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    scheduled: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Scheduled' },
    active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Live Now' },
    completed: { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Completed' },
    cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Cancelled' },
    pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
    accepted: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Accepted' },
    rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Declined' }
  };

  const current = map[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${current.bg}`}>
      {current.label}
    </span>
  );
}
