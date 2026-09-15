import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Shield, Key, AlertCircle, CheckCircle2, UserCheck, Eye, EyeOff } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const Signup = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'admin' ? 'ADMIN' : 'MEMBER'; // Default to MEMBER (User)

  const [role, setRole] = useState(initialMode); // 'MEMBER' (User default) or 'ADMIN'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    adminSecretCode: ''
  });
  
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const isUserSignup = role === 'MEMBER';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingMessage('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (!isUserSignup && !formData.adminSecretCode.trim()) {
      return setError('Admin secret code is required to register as Admin.');
    }

    setLoading(true);
    try {
      const res = await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: isUserSignup ? 'MEMBER' : 'ADMIN',
        adminSecretCode: formData.adminSecretCode
      });

      if (res.isPending) {
        setPendingMessage(res.message);
      } else if (res.user?.role === 'ADMIN') {
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

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full mb-3 flex items-center justify-between">
        <BackButton fallback="/" label="Back to Home" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full border border-gray-100 shadow-xl space-y-6"
      >
        {/* Top Tab Switcher: User (Default) vs Admin */}
        <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setRole('MEMBER'); setError(''); setPendingMessage(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isUserSignup 
                ? 'bg-white text-brand-700 shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            User Signup
          </button>

          <button
            type="button"
            onClick={() => { setRole('ADMIN'); setError(''); setPendingMessage(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              !isUserSignup 
                ? 'bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-900 text-white shadow-xs' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Signup
          </button>
        </div>

        {/* Header Title */}
        <div className="text-center">
          {isUserSignup ? (
            <div>
              <img src="/logo.png" alt="Mitra-Mandal Logo" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm" />
              <h2 className="text-2xl font-bold text-gray-900">User / Member Registration</h2>
              <p className="text-xs text-gray-500 mt-1">Create a new Mitra-Mandal member account</p>
            </div>
          ) : (
            <div>
              <img src="/logo.png" alt="Mitra-Mandal Logo" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm" />
              <h2 className="text-2xl font-bold text-gray-900">Admin Registration</h2>
              <p className="text-xs text-gray-500 mt-1">Requires Admin Secret Code</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pendingMessage ? (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-amber-900">Registration Submitted</h4>
            <p className="text-xs text-amber-800 leading-relaxed">{pendingMessage}</p>
            <Link
              to="/login?mode=user"
              className="inline-block mt-2 px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Go to User Sign In Page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rajesh Patel"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/,/g, '.') })}
                  placeholder="name@example.com (optional)"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>



            {/* Admin Secret Code Field (Only shown in Admin mode) */}
            {!isUserSignup && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  Admin Secret Code
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-purple-700 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={formData.adminSecretCode}
                    onChange={(e) => setFormData({ ...formData, adminSecretCode: e.target.value })}
                    placeholder="Enter 6-digit Secret Code"
                    className="w-full pl-10 pr-3 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-900 focus:bg-white focus:border-purple-600 outline-hidden transition-all"
                  />
                </div>
              </motion.div>
            )}

            {isUserSignup && (
              <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-medium">
                Note: Member registration requires acceptance from Admin before you can log in.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50 ${
                isUserSignup 
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-brand-900 via-indigo-900 to-purple-900 hover:opacity-95'
              }`}
            >
              {loading ? 'Creating Account...' : (isUserSignup ? 'Submit User Registration Request' : 'Register as Admin')}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
          <div>
            Already have an account?{' '}
            <Link to={isUserSignup ? '/login?mode=user' : '/login?mode=admin'} className="text-brand-600 font-bold hover:underline">
              {isUserSignup ? 'Sign In as User' : 'Sign In as Admin'}
            </Link>
          </div>

          <div className="pt-2 border-t border-gray-100">
            {isUserSignup ? (
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className="text-[11px] font-bold text-gray-600 hover:text-brand-600"
              >
                🛡️ Switch to Admin Registration
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRole('MEMBER')}
                className="text-[11px] font-bold text-gray-600 hover:text-brand-600"
              >
                👤 Switch to Member / User Registration
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
