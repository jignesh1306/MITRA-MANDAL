import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, BadgeIndianRupee } from 'lucide-react';

export const FundLedgerPage = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/fund/summary'),
      api.get('/fund/transactions')
    ]).then(([sumRes, txRes]) => {
      setSummary(sumRes.data);
      setTransactions(txRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton count={4} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Fund Ledger</h1>
          <p className="text-xs text-gray-500">Transparent cash-basis transaction ledger for Mitra-Mandal.</p>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-[11px] text-gray-500 font-semibold">Current Fund Balance</span>
            <div className="text-xl font-bold text-brand-600 mt-1">{formatCurrency(summary.currentBalance)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-[11px] text-gray-500 font-semibold">Member Contributions</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalContributions)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-[11px] text-gray-500 font-semibold">Loan Interest Income</span>
            <div className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(summary.totalLoanInterest)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20">
            <span className="text-[11px] text-purple-700 font-semibold">Extra Interest / Penalty</span>
            <div className="text-xl font-bold text-purple-700 mt-1">{formatCurrency(summary.totalExtraInterestPenalty || 0)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-200">
            <span className="text-[11px] text-gray-500 font-semibold">Total Expenses</span>
            <div className="text-xl font-bold text-red-600 mt-1">{formatCurrency(summary.totalExpenses)}</div>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 font-bold text-sm text-gray-900">
          All Financial Transactions
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.map(t => {
            const isFine = t.category === 'FINE';
            const isIncome = t.type === 'INCOME';
            return (
              <div key={t._id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 text-xs">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    isFine 
                      ? 'bg-purple-50 text-purple-600' 
                      : isIncome 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-red-50 text-red-600'
                  }`}>
                    {isFine ? (
                      <BadgeIndianRupee className="w-4 h-4" />
                    ) : isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">
                      {t.referenceId} • {isFine ? 'Extra Interest / Penalty' : t.category}
                    </div>
                    <p className="text-gray-500 text-[11px] mt-0.5">{t.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${
                    isFine 
                      ? 'text-purple-600' 
                      : isIncome 
                        ? 'text-emerald-600' 
                        : 'text-red-600'
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(t.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
