import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import { Phone, Mail, Calendar, LogOut, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

export const MemberProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-5 pb-4">
      {/* Compact Minimalist Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-100/80 space-y-6"
      >
        {/* Header Avatar & Name */}
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0"
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </motion.div>

          <div className="space-y-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 tracking-tight truncate">
              {user.name}
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold">
              <UserCheck className="w-3 h-3 text-brand-600" />
              {user.role === 'ADMIN' ? 'Group Admin' : 'Group Member'}
            </span>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

        {/* Profile Details List */}
        <div className="space-y-3">
          {/* Mobile Number Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mobile Number</span>
              <p className="text-xs sm:text-sm font-black text-gray-900 tracking-wide mt-0.5 truncate">
                {user.phone || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Email Address Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email Address</span>
              <p className="text-xs sm:text-sm font-black text-gray-900 tracking-wide mt-0.5 truncate">
                {user.email || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Joining Date Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Joining Date</span>
              <p className="text-xs sm:text-sm font-black text-gray-900 tracking-wide mt-0.5 truncate">
                {formatDate(user.joiningDate || user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Vibrant Red Logout Button */}
        <div className="pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleLogout}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
