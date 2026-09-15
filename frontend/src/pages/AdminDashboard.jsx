import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MoneyCard } from '../components/MoneyCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, Users, BadgeIndianRupee, AlertTriangle, ArrowRight, KeyRound, UserCheck } from 'lucide-react';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin-summary')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton count={4} /></div>;
  if (!data) return null;

  const { fundSummary, members, contributions, loans, charts, passwordResetCode } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500">Overall financial overview & member administration of Mitra-Mandal.</p>
        </div>
      </div>

      {/* Top Main Financial Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-brand-200 uppercase tracking-wider">Current Fund Balance</span>
            <div className="text-3xl sm:text-5xl font-black mt-2 tracking-tight">
              {formatCurrency(fundSummary.currentBalance)}
            </div>
            <p className="text-xs text-brand-200 mt-2">
              Total Income: {formatCurrency(fundSummary.totalIncome)} • Total Expenses: {formatCurrency(fundSummary.totalExpense)}
            </p>
          </div>

          <Link
            to="/admin/fund"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl transition-colors border border-white/10 flex items-center gap-2"
          >
            View Fund Ledger <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Security & Approvals Action Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 6-Digit Password Reset Code Display */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-3xl shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" /> Active Password Reset Code
            </span>
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">One-Time Use</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-mono font-black tracking-widest bg-black/20 px-4 py-2 rounded-2xl border border-white/20">
              {passwordResetCode || '******'}
            </span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            Provide this code to a user requesting a password reset. Once used, a new 6-digit code will automatically generate.
          </p>
        </div>

        {/* Pending Member Approval Requests */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-3xl shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Pending Registration Requests
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-2">
              {members.pending || 0} Member{members.pending === 1 ? '' : 's'}
            </div>
            <p className="text-xs opacity-90 mt-1">
              New registration requests waiting for your approval before they can sign in.
            </p>
          </div>
          <div>
            <Link
              to="/admin/members?status=PENDING"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Review Pending Registrations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <MoneyCard
          title="Active Members"
          amount={members.active}
          subtitle={`Total Registered: ${members.total}`}
          icon={Users}
          color="white"
        />

        {/* Contributions */}
        <MoneyCard
          title="Monthly Contributions"
          amount={formatCurrency(contributions.paidAmount)}
          subtitle={`Paid: ${contributions.paidCount} • Pending: ${contributions.pendingCount}`}
          icon={Wallet}
          color="white"
        />

        {/* Active Loans */}
        <MoneyCard
          title="Active Loan Principal"
          amount={formatCurrency(loans.totalOutstandingPrincipal)}
          subtitle={`Active Loans: ${loans.activeCount}`}
          icon={BadgeIndianRupee}
          color="white"
        />

        {/* Overdue EMIs */}
        <MoneyCard
          title="Overdue EMIs"
          amount={loans.overdueEMIsCount}
          subtitle="Requires attention"
          icon={AlertTriangle}
          color="white"
        />
      </div>

      {/* Recharts Monthly Comparison Chart */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900">Monthly Income vs Expense Comparison</h3>
        <div className="h-64 sm:h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
              <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
