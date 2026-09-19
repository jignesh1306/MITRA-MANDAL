import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { BackButton } from '../components/BackButton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  BadgeIndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Percent, 
  ArrowUpRight, 
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';

export const MemberDetailViewPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/members/${id}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <BackButton fallback="/member/directory" label="Back to Member Directory" />
        <p className="mt-8 text-sm text-gray-500 font-semibold">Member details not found.</p>
      </div>
    );
  }

  const { user, summary, loans = [], contributions = [] } = data;
  const activeLoan = loans.find(l => l.status === 'ACTIVE') || loans[0];

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-3.5 sm:space-y-6">
      {/* Back Button */}
      <BackButton fallback="/member/directory" label="Back to Member Directory" />

      {/* Member Profile Card */}
      <div className="max-w-md mx-auto bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="space-y-0.5 min-w-0">
            <h1 className="text-lg font-black text-gray-900 tracking-tight truncate">{user.name}</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
              {user.role === 'ADMIN' ? 'Group Admin' : 'Group Member'}
            </span>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mobile Number</span>
              <p className="font-black text-gray-900 mt-0.5 truncate">{user.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Joining Date</span>
              <p className="font-black text-gray-900 mt-0.5 truncate">{formatDate(user.joiningDate || user.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Regular Monthly EMI / Contribution Status */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Regular Monthly Fund EMI Status
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-800">Total Contributions Paid</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {formatCurrency(summary?.totalPaidContributions || 0)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-800">Pending Contributions</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {formatCurrency(summary?.pendingContributions || 0)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-800">Extra Interest / Penalty</span>
              <div className="text-2xl font-bold text-purple-700 mt-1">
                {formatCurrency(summary?.totalExtraInterestPenalty || 0)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <BadgeIndianRupee className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Detailed Loan Status */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BadgeIndianRupee className="w-5 h-5 text-indigo-600" />
            Member Loan Details
          </h2>
          {activeLoan && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              activeLoan.status === 'ACTIVE' 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {activeLoan.status === 'ACTIVE' ? 'Active Loan' : 'Loan Closed'}
            </span>
          )}
        </div>

        {!activeLoan ? (
          <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-500">
            This member has no recorded loans.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-gray-700">Repayment Progress</span>
                <span className="text-brand-600">{activeLoan.summary?.progressPercent || 0}% Completed</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, activeLoan.summary?.progressPercent || 0)}%` }}
                />
              </div>
            </div>

            {/* Comprehensive Financial Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Total Original Loan Taken */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-[11px] font-semibold text-gray-500">Original Principal Loan</span>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(activeLoan.summary?.originalPrincipal || activeLoan.principal)}
                </p>
              </div>

              {/* Total Loan with Interest */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                <span className="text-[11px] font-semibold text-indigo-700">Total Repayment (With Interest)</span>
                <p className="text-lg font-bold text-indigo-900">
                  {formatCurrency(activeLoan.summary?.totalRepaymentWithInterest || activeLoan.totalRepayment)}
                </p>
                <span className="text-[10px] text-indigo-500 block">
                  Interest: {formatCurrency(activeLoan.summary?.totalInterest || activeLoan.totalInterest)} @ {activeLoan.interestRate}%
                </span>
              </div>

              {/* Completed / Repaid Principal */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700">Completed Repayments</span>
                <p className="text-lg font-bold text-emerald-800">
                  {formatCurrency(activeLoan.summary?.paidPrincipal || 0)}
                </p>
                <span className="text-[10px] text-emerald-600 block">
                  Interest Paid: {formatCurrency(activeLoan.summary?.paidInterest || 0)}
                </span>
              </div>

              {/* Remaining Principal */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1">
                <span className="text-[11px] font-semibold text-amber-800">Remaining Principal</span>
                <p className="text-lg font-bold text-amber-900">
                  {formatCurrency(activeLoan.summary?.remainingPrincipal || 0)}
                </p>
              </div>

              {/* Remaining Interest */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
                <span className="text-[11px] font-semibold text-rose-800">Remaining Interest</span>
                <p className="text-lg font-bold text-rose-900">
                  {formatCurrency(activeLoan.summary?.remainingInterest || 0)}
                </p>
              </div>

              {/* Remaining Total Balance */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-1">
                <span className="text-[11px] font-semibold text-purple-800">Total Remaining Balance</span>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(activeLoan.summary?.remainingTotalRepayment || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
