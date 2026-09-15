import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BackButton } from '../components/BackButton';

export const MemberDetailsAdmin = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/members/${id}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6"><LoadingSkeleton count={4} /></div>;
  if (!data) return null;

  const { user, summary, transactions } = data;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <BackButton fallback="/admin/members" label="Back to Members List" />
      </div>

      {/* Profile Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-600 text-white font-bold text-2xl flex items-center justify-center">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{user.email} • {user.phone}</p>
          </div>
        </div>
        <StatusBadge status={user.status} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Paid Contributions</span>
          <div className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalPaidContributions)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Pending Contributions</span>
          <div className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(summary.pendingContributions)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Total Loans</span>
          <div className="text-lg font-bold text-brand-600 mt-1">{summary.totalLoans}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Active Loans</span>
          <div className="text-lg font-bold text-indigo-600 mt-1">{summary.activeLoans}</div>
        </div>
      </div>

      {/* History Tabs / Lists */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t._id} className="p-3 rounded-xl bg-gray-50 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-gray-900">{t.referenceId}</span> - {t.description}
                <div className="text-[10px] text-gray-500">{formatDate(t.date)}</div>
              </div>
              <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
