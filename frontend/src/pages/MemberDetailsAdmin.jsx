import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BackButton } from '../components/BackButton';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt,
  CheckCircle2
} from 'lucide-react';

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

  if (loading) return <div className="p-4 max-w-4xl mx-auto"><LoadingSkeleton count={3} /></div>;
  if (!data) return null;

  const { user, summary, loans = [], transactions = [] } = data;

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-4 pb-4">
      <div>
        <BackButton fallback="/admin/members" label="Back to Members Directory" />
      </div>

      {/* Compact Member Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-600 text-white font-bold text-base flex items-center justify-center shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900">{user.name}</h1>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-extrabold rounded-md uppercase">
                {user.role}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {user.phone} • {user.email}
            </p>
          </div>
        </div>
        <StatusBadge status={user.status} />
      </div>

      {/* Minimal Compact Summary Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-white">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-xs">
          <span className="text-[9px] font-extrabold text-emerald-100 uppercase tracking-wider block">Total Contributions</span>
          <div className="text-base font-black mt-0.5">{formatCurrency(summary.totalPaidContributions)}</div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xs">
          <span className="text-[9px] font-extrabold text-amber-100 uppercase tracking-wider block">Pending Due</span>
          <div className="text-base font-black mt-0.5">{formatCurrency(summary.pendingContributions)}</div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xs">
          <span className="text-[9px] font-extrabold text-blue-100 uppercase tracking-wider block">Total Loans</span>
          <div className="text-base font-black mt-0.5">{summary.totalLoans} Loans</div>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-900 shadow-xs">
          <span className="text-[9px] font-extrabold text-purple-100 uppercase tracking-wider block">Active Loans</span>
          <div className="text-base font-black mt-0.5">{summary.activeLoans} Active</div>
        </div>
      </div>

      {/* Direct Minimal Transactions Audit List (No tabs) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-brand-600" />
            Recent Member Transactions & Activity
          </h3>
          <span className="text-[11px] text-gray-400 font-medium">{transactions.length} Records</span>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No transaction records found for this member.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(t => {
              const isIncome = t.type === 'INCOME';
              return (
                <div key={t._id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">{t.referenceId}</span>
                        <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-[9px] font-bold rounded uppercase">
                          {t.category ? t.category.replace(/_/g, ' ') : t.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600">{t.description}</p>
                      <span className="text-[9px] text-gray-400">{formatDate(t.date)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-black ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


