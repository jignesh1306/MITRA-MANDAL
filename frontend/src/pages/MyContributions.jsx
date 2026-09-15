import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { StatusBadge } from '../components/StatusBadge';
import { Wallet, CheckCircle2, Clock, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';

export const MyContributions = () => {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyContributions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contributions/my');
      setContributions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyContributions();
  }, []);

  if (loading) return <div className="p-6 max-w-4xl mx-auto"><LoadingSkeleton count={4} /></div>;

  // Calculate total paid fund given so far
  const totalPaidFund = contributions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const getMonthName = (m) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[m - 1] || `Month ${m}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Total Paid Fund Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-200" />
              Total Given Fund Balance
            </span>
            <div className="text-3xl sm:text-5xl font-black mt-2 tracking-tight">
              {formatCurrency(totalPaidFund)}
            </div>
            <p className="text-xs text-emerald-100 mt-2 font-medium">
              Accumulated total monthly contributions given to Mitra-Mandal
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{contributions.filter(c => c.status === 'PAID').length} Months Paid</span>
          </div>
        </div>
      </motion.div>

      {/* Monthly Fund Schedule & History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" />
            <span>Monthly Fund Status & History</span>
          </h2>
          <span className="text-xs text-gray-500 font-semibold">{contributions.length} Records</span>
        </div>

        {contributions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs font-semibold">
            No contribution records found. Once Admin approves your joining date, monthly records will be listed here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contributions.map((c) => {
              const monthLabel = getMonthName(c.month);
              const isPaid = c.status === 'PAID';
              const isOverdue = c.status === 'OVERDUE';

              return (
                <motion.div
                  key={c._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-3xl border transition-all shadow-xs flex items-center gap-4 bg-white ${
                    isPaid 
                      ? 'border-emerald-200 hover:border-emerald-300' 
                      : (isOverdue ? 'border-red-200 hover:border-red-300' : 'border-amber-200 hover:border-amber-300')
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    isPaid ? 'bg-emerald-50 text-emerald-600' : (isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')
                  }`}>
                    {isPaid ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-base font-black text-gray-900 truncate">
                        {monthLabel} {c.year}
                      </h3>
                      <StatusBadge status={c.status} />
                    </div>

                    <p className="text-xs text-gray-500 font-medium leading-tight">
                      Due: 1st - 5th {monthLabel}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-black text-gray-900">
                        {formatCurrency(c.amount)}
                      </span>
                      {isPaid && (
                        <span className="text-[10px] font-bold text-emerald-600">
                          Paid {c.paidAt ? new Date(c.paidAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
