import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  Wallet, 
  CreditCard, 
  PlusCircle, 
  Calculator, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react';

export const MemberDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/member-summary')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 max-w-4xl mx-auto"><LoadingSkeleton count={4} /></div>;

  const totalGroupFund = data?.totalGroupFund || 0;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-3.5 sm:space-y-6 pb-4">
      {/* 1. Total Group Fund Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onClick={() => navigate('/member/reports')}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl cursor-pointer hover:shadow-2xl transition-all group"
      >
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-8 top-4 text-white/10 group-hover:text-white/20 transition-colors">
          <Sparkles className="w-20 h-20 animate-pulse" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide text-brand-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{t('dashboard.communityCapital')}</span>
            </div>
            <span className="text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full text-white/90 group-hover:bg-white/25 transition-all flex items-center gap-1">
              {t('dashboard.viewReport')} <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block pt-1">
            {t('dashboard.totalGroupFundBalance')}
          </span>

          <div className="text-3xl sm:text-5xl font-black tracking-tight">
            {formatCurrency(totalGroupFund)}
          </div>

          <p className="text-xs text-blue-100 font-medium">
            {t('dashboard.treasuryDesc')}
          </p>
        </div>
      </motion.div>

      {/* 2. Three Main Feature Buttons */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          {t('dashboard.quickServices')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Button 1: Submit Your EMI */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/member/submit-emi"
              className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 text-left transition-all group flex items-center gap-4 relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7" />
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-base font-black text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                    {t('dashboard.submitYourEmi')}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <p className="text-xs text-gray-500 font-medium leading-tight">
                  {t('dashboard.submitEmiDesc')}
                </p>
                <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                  {t('dashboard.activeFeature')}
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Button 2: Apply for Loan */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/member/loans/request"
              className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-amber-300 text-left transition-all group flex items-center gap-4 relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <PlusCircle className="w-7 h-7" />
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-base font-black text-gray-900 group-hover:text-amber-700 transition-colors truncate">
                    {t('dashboard.applyForLoan')}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <p className="text-xs text-gray-500 font-medium leading-tight">
                  {t('dashboard.applyLoanDesc')}
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Button 3: EMI Calculator */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/calculator"
              className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-300 text-left transition-all group flex items-center gap-4 relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calculator className="w-7 h-7" />
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-base font-black text-gray-900 group-hover:text-brand-700 transition-colors truncate">
                    {t('dashboard.emiCalculator')}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
                <p className="text-xs text-gray-500 font-medium leading-tight">
                  {t('dashboard.calculatorDesc')}
                </p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
