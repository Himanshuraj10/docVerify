import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = String(status || '').toUpperCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  if (norm === 'VERIFIED' || norm === 'PASS' || norm === 'ACTIVE' || norm === 'RESOLVED') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  } else if (norm === 'SUSPICIOUS' || norm === 'WARN' || norm === 'ATTENTION' || norm === 'UNDER REVIEW' || norm === 'INVESTIGATION' || norm === 'MODERATE') {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
  } else if (norm === 'REJECTED' || norm === 'FAIL' || norm === 'HIGH' || norm === 'MISMATCH') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = XCircle;
  }

  const sizeClasses = size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClasses}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {norm}
    </span>
  );
}
