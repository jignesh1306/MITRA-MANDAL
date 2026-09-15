import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency } from '../utils/formatters';
import { Wallet, Sparkles, RefreshCw } from 'lucide-react';

export const AdminContributionsPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmBulk, setConfirmBulk] = useState(false);

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

  const handleGenerate = async () => {
    await api.post('/contributions/generate', { month, year });
    fetchContribs();
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.post(`/contributions/${id}/mark-paid`);
      fetchContribs();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkMarkPaid = async () => {
    setConfirmBulk(false);
    try {
      await api.post('/contributions/mark-all-paid', { month, year });
      fetchContribs();
    } catch (err) {
      alert(err.message);
    }
  };

  const paidCount = list.filter(c => c.status === 'PAID').length;
  const pendingCount = list.filter(c => c.status !== 'PAID').length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Contribution Management</h1>
            <p className="text-xs text-gray-500">Track and update monthly member contribution payments.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Generate
          </button>
          <button
            onClick={() => setConfirmBulk(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Mark All Paid
          </button>
        </div>
      </div>

      {/* Month Selector & Summary Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6 text-xs">
          <div>
            <span className="text-gray-500 font-semibold block">Total Members</span>
            <span className="text-gray-900 font-bold text-sm">{list.length} Members</span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Paid</span>
            <span className="text-emerald-600 font-bold text-sm">{paidCount} Members</span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">Pending</span>
            <span className="text-amber-600 font-bold text-sm">{pendingCount} Members</span>
          </div>
        </div>
      </div>

      {/* Member Grid */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((item) => (
            <div key={item._id} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{item.memberId?.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.amount)}</p>
                <div className="mt-2">
                  <StatusBadge status={item.status} />
                </div>
              </div>

              {item.status !== 'PAID' && (
                <button
                  onClick={() => handleMarkPaid(item._id)}
                  className="px-3 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors"
                >
                  ✓ Mark Paid
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmBulk}
        title="Mark All as Paid?"
        message="Are you sure you want to mark all pending monthly contributions as paid for this month?"
        onConfirm={handleBulkMarkPaid}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
};
