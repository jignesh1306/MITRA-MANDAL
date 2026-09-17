import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, Phone, Shield, User, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const Login = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'admin' ? 'ADMIN' : 'USER'; // Default to USER

  const [mode, setMode] = useState(initialMode); // 'USER' (default) or 'ADMIN'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(phone, password, mode);
      if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/member');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isUserMode = mode === 'USER';

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full mb-3 flex items-center justify-between">
        <BackButton to="/" label="Back to Home" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-xl space-y-6"
      >
        {/* Top Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setMode('USER'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isUserMode 
                ? 'bg-white text-brand-700 shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            User Sign In
          </button>

          <button
            type="button"
            onClick={() => { setMode('ADMIN'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              !isUserMode 
                ? 'bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-900 text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Sign In
          </button>
        </div>

        {/* Header Info */}
        <div className="text-center">
          {isUserMode ? (
            <div>
              <img src="/logo.png" alt="Mitra-Mandal Logo" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm" />
              <h2 className="text-2xl font-bold text-gray-900">Member / User Sign In</h2>
              <p className="text-xs text-gray-500 mt-1">Sign in with your mobile number</p>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-900 via-indigo-900 to-purple-900 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Sign In</h2>
              <p className="text-xs text-gray-500 mt-1">Sign in with your mobile number</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isUserMode ? 'User Mobile Number' : 'Admin Mobile Number'}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-bold text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              isUserMode 
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700' 
                : 'bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-900 hover:opacity-95'
            }`}
          >
            {loading ? 'Signing in...' : (isUserMode ? 'Sign In as User' : 'Sign In as Admin')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <Link 
            to={isUserMode ? '/signup?mode=user' : '/signup?mode=admin'} 
            className="text-xs font-black text-brand-600 hover:text-brand-700 hover:underline transition-colors"
          >
            Register as New User
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
