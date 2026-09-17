import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { StatusBadge } from '../components/StatusBadge';
import { LoanProgress } from '../components/LoanProgress';
import { 
  BadgeIndianRupee, 
  PlusCircle, 
  Calculator, 
  Clock, 
  TrendingDown, 
  Percent, 
  CheckCircle2, 
  ArrowUpRight, 
  AlertCircle 
} from 'lucide-react';

export const MyLoans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans/my');
      setLoans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoans();
  }, []);

  if (loading) return <div className="p-6 max-w-4xl mx-auto"><LoadingSkeleton count={4} /></div>;

  const pendingLoans = loans.filter(l => l.status === 'PENDING');
  const runningLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED');
  const pastLoans = loans.filter(l => l.status === 'COMPLETED' || l.status === 'REJECTED' || l.status === 'CANCELLED');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-4">
      {/* Header & Apply Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BadgeIndianRupee className="w-7 h-7 text-amber-600" />
            <span>My Loans Dashboard</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Track your active loan balances, interest calculations, and repayments.</p>
        </div>

        <div className="flex gap-2">
          <Link
            to="/calculator"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
          >
            <Calculator className="w-4 h-4 text-brand-600" />
            EMI Calculator
          </Link>
          <Link
            to="/member/loans/request"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            Apply for Loan
          </Link>
        </div>
      </div>

      {/* Pending Loan Requests Section */}
      {pendingLoans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            Pending Admin Approval ({pendingLoans.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingLoans.map((item) => (
              <div key={item._id} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-extrabold text-gray-900">{formatCurrency(item.principal)}</span>
                  <StatusBadge status="PENDING" />
                </div>
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>Tenure: <strong>{item.months} Months</strong></span>
                  <span>Rate: <strong>{item.interestRate}% Monthly</strong></span>
                </div>
                {item.note && (
                  <p className="text-xs text-gray-500 italic bg-white/70 p-2 rounded-lg border border-amber-100">
                    "{item.note}"
                  </p>
                )}
                <p className="text-[11px] text-amber-700 font-medium">
                  Submitted on {formatDate(item.createdAt || item.requestDate)} • Awaiting Admin Review
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Running Loans Section */}
      {runningLoans.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-wider text-amber-700">
            Active / Running Loans ({runningLoans.length})
          </h2>

          {runningLoans.map((item) => {
            const summary = item.summary || {};
            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl p-6 border border-amber-200 shadow-md space-y-6"
              >
                {/* Top Status Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        {item.interestType === 'REDUCING' ? 'Reducing Interest Rate' : 'Flat Interest Rate'} • {item.interestRate}% Monthly
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mt-2">
                      {item.purpose || 'Community Member Loan'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tenure: {item.months} Months • Started: {item.startDate ? formatDate(item.startDate) : 'Active'}
                    </p>
                  </div>

                  <Link
                    to={`/member/loans/${item._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200"
                  >
                    <span>View Installments</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* 4 Essential Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. Remaining Loan Amount */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Remaining Principal</span>
                    <div className="text-xl font-black text-amber-900 mt-1">
                      {formatCurrency(summary.remainingPrincipal || 0)}
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium mt-1 block">Principal Balance</span>
                  </div>

                  {/* 2. Total Loan Amount With Interest */}
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Total With Interest</span>
                    <div className="text-xl font-black text-indigo-900 mt-1">
                      {formatCurrency(summary.totalRepaymentWithInterest || 0)}
                    </div>
                    <span className="text-[10px] text-indigo-700 font-medium mt-1 block">Original: {formatCurrency(summary.originalPrincipal || 0)}</span>
                  </div>

                  {/* 3. Remaining Interest Amount */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Remaining Interest</span>
                    <div className="text-xl font-black text-rose-900 mt-1">
                      {formatCurrency(summary.remainingInterest || 0)}
                    </div>
                    <span className="text-[10px] text-rose-700 font-medium mt-1 block">Total Int: {formatCurrency(summary.totalInterest || 0)}</span>
                  </div>

                  {/* 4. Total Remaining Amount to Pay */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Total Remaining</span>
                    <div className="text-xl font-black text-emerald-900 mt-1">
                      {formatCurrency(summary.remainingTotalRepayment || 0)}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Principal + Interest</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                    <span>Repayment Progress</span>
                    <span>{summary.progressPercent || 0}% Paid</span>
                  </div>
                  <LoanProgress percent={summary.progressPercent || 0} />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-gray-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BadgeIndianRupee className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Running Loans Currently</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You do not have any active running loan. You can apply for a new community loan anytime.
          </p>
        </div>
      )}

      {/* Past / Completed Loans History */}
      {pastLoans.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h2 className="text-sm font-bold text-gray-700">Loan History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastLoans.map((item) => (
              <div key={item._id} className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(item.principal)}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-gray-500">Purpose: {item.purpose || 'Community Loan'} • {item.months} Months</p>
                <div className="text-[11px] text-gray-400">Total Repaid: {formatCurrency(item.totalRepayment)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
