import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, PlayCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const configs = {
    PAID: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    COMPLETED: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    PENDING: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    DUE: { label: 'Due', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    UPCOMING: { label: 'Upcoming', bg: 'bg-gray-50 text-gray-600 border-gray-200', icon: Clock },
    OVERDUE: { label: 'Overdue', bg: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
    ACTIVE: { label: 'Active', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: PlayCircle },
    APPROVED: { label: 'Approved', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle }
  };

  const config = configs[status] || { label: status, bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};
