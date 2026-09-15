import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Calculator } from 'lucide-react';
import api from '../services/api';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(res => setUnreadCount(res.data.unreadCount)).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? (user.role === 'ADMIN' ? '/admin' : '/member') : '/'} className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Mitra-Mandal Logo" className="w-10 h-10 object-contain rounded-xl shadow-xs" />
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight font-gujarati">મિત્ર-મંડળ</span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-brand-600 ml-2 px-2 py-0.5 bg-brand-50 rounded-full">
                {user?.role === 'ADMIN' ? 'Admin' : 'Member'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/calculator" 
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-brand-600 bg-gray-100 hover:bg-brand-50 rounded-xl transition-all"
            >
              <Calculator className="w-4 h-4 text-brand-600" />
              EMI Calculator
            </Link>

            {user ? (
              <Link 
                to={user.role === 'ADMIN' ? '/admin/notifications' : '/member/notifications'} 
                className="relative p-2 text-gray-600 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3.5 py-2 text-xs font-semibold text-brand-700 hover:text-brand-800">
                  Login
                </Link>
                <Link to="/signup" className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all hover:scale-105">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
