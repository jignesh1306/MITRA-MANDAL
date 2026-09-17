import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { MoneyCard } from '../components/MoneyCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Wallet, 
  Users, 
  BadgeIndianRupee, 
  AlertTriangle, 
  ArrowRight, 
  KeyRound, 
  UserCheck, 
  FileCheck2, 
  FileSpreadsheet,
  Building2
} from 'lucide-react';

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

  const { 
    fundSummary, 
    members, 
    contributions, 
    loans, 
    charts, 
    passwordResetCode, 
    pendingEMISubmissionsCount = 0 
  } = data;

  const totalPendingActions = (members.pending || 0) + pendingEMISubmissionsCount + (loans.pendingRequestsCount || 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-4">
      {/* Page Header & Quick Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-gray-900">Admin Control Center</h1>
            {totalPendingActions > 0 && (
              <span className="px-2.5 py-0.5 bg-amber-500 text-white font-black text-xs rounded-full">
                {totalPendingActions} Action{totalPendingActions === 1 ? '' : 's'} Required
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Comprehensive management of member requests, EMI proof approvals, loan distributions, and group funds.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/emi-submissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl border border-indigo-200 transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Proof Approvals ({pendingEMISubmissionsCount})
          </Link>
          <Link
            to="/admin/loan-requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold rounded-xl border border-amber-200 transition-colors"
          >
            <BadgeIndianRupee className="w-4 h-4 text-amber-600" />
            Loan Requests ({loans.pendingRequestsCount || 0})
          </Link>
        </div>
      </div>

      {/* Top Financial Balance Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-200 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-brand-400" />
              <span>Mitra-Mandal Treasury & Group Pool Balance</span>
            </div>
            <div className="text-3xl sm:text-5xl font-black mt-2 tracking-tight">
              {formatCurrency(fundSummary.currentBalance)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-brand-200 mt-3 pt-3 border-t border-white/10">
              <span>Total Group Income: <strong className="text-emerald-400">{formatCurrency(fundSummary.totalIncome)}</strong></span>
              <span>•</span>
              <span>Total Disbursed / Expenses: <strong className="text-rose-300">{formatCurrency(fundSummary.totalExpense)}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              to="/admin/fund"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-xl transition-all border border-white/15 flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Fund Ledger</span>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </Link>
            <Link
              to="/admin/reports"
              className="px-5 py-3 bg-white text-gray-900 hover:bg-gray-100 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>Financial Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Action Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. EMI Screenshot Proof Submissions */}
        <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-xs space-y-3 flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" /> EMI Screenshot Submissions
              </span>
              {pendingEMISubmissionsCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">Action Needed</span>
              )}
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">
              {pendingEMISubmissionsCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Member payment screenshots awaiting review, verification, and Cloudinary auto-cleanup.
            </p>
          </div>
          <Link
            to="/admin/emi-submissions"
            className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-extrabold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Review Submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2. Pending Loan Applications */}
        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-xs space-y-3 flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <BadgeIndianRupee className="w-4 h-4 text-amber-600" /> Loan Request Applications
              </span>
              {(loans.pendingRequestsCount || 0) > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">New Request</span>
              )}
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">
              {loans.pendingRequestsCount || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Community loan applications submitted by members waiting for admin approval & schedule creation.
            </p>
          </div>
          <Link
            to="/admin/loan-requests"
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-extrabold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Approve Loan Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3. Pending User Registrations */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-600" /> Member Registration Approvals
              </span>
              {(members.pending || 0) > 0 && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">New Users</span>
              )}
            </div>
            <div className="text-3xl font-black text-gray-900 mt-2">
              {members.pending || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              New member signups pending admin verification before granting login access to portal.
            </p>
          </div>
          <Link
            to="/admin/members?status=PENDING"
            className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-extrabold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Manage Registrations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Security & Password Reset Code Hub */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 sm:p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block opacity-90">
              Active Password Reset Code
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full inline-block mt-0.5 whitespace-nowrap">
              Admin Single-Use
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest bg-black/25 px-5 py-2 rounded-2xl border border-white/20 shadow-inner">
            {passwordResetCode || '******'}
          </span>
        </div>
      </div>
    </div>
  );
};

