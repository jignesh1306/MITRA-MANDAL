import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Wallet, CheckCircle2 } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AdminContributionsPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContribs = () => {
    setLoading(true);
    api.get(`/contributions?month=${month}&year=${year}`)
      .then(res => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContribs();
  }, [month, year]);

  const handleMarkPaid = async (id) => {
    try {
      await api.post(`/contributions/${id}/mark-paid`);
      fetchContribs();
    } catch (err) {
      alert(err.message);
    }
  };

  const paidCount = list.filter(c => c.status === 'PAID').length;
  const pendingCount = list.filter(c => c.status !== 'PAID').length;
  const totalCollected = list
    .filter(c => c.status === 'PAID')
    .reduce((acc, c) => acc + (c.amount || 0), 0);

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-3.5 pb-4">
      {/* Compact Header & Selector */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Monthly Contributions</h1>
            <p className="text-[11px] text-gray-500">Track regular EMI member payments</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-1/2 sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden transition-all cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-1/2 sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden transition-all cursor-pointer"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact Vibrant Bright Colored Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Total Active Members - Bright Blue/Indigo */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-blue-100 uppercase tracking-wider opacity-90">Total Members</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{list.length} Members</span>
        </div>

        {/* Paid Members - Vibrant Emerald Green */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-wider opacity-90">Paid</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{paidCount} Members</span>
        </div>

        {/* Pending Members - Bright Amber/Orange */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-wider opacity-90">Pending</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{pendingCount} Members</span>
        </div>

        {/* Total Collected - Vibrant Violet/Purple */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-purple-100 uppercase tracking-wider opacity-90">Total Collected</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{formatCurrency(totalCollected)}</span>
        </div>
      </div>

      {/* Member Regular EMI Payment Status List */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : list.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs font-medium">
          No registered active members found for {MONTH_NAMES[month - 1]} {year}.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((item) => {
            const isPaid = item.status === 'PAID';
            return (
              <div 
                key={item._id} 
                className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between gap-2.5"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {item.memberId?.name ? item.memberId.name.charAt(0) : 'M'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        {item.memberId?.name || 'Member'}
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        {item.memberId?.phone || ''}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 text-xs">
                  <span className="text-gray-500 text-[11px] font-medium">Monthly Regular EMI:</span>
                  <span className="font-extrabold text-gray-900">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                {isPaid ? (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Paid on {item.paidAt ? formatDate(item.paidAt) : 'Recorded'}
                  </span>
                ) : (
                  <button
                    onClick={() => handleMarkPaid(item._id)}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark EMI Paid
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


