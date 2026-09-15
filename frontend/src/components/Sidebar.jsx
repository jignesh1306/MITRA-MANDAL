import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Users, Wallet, BadgeIndianRupee, TrendingUp, TrendingDown, 
  FileText, Settings, ShieldAlert, Bell, User
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const memberNav = [
    { to: '/member', label: 'Dashboard', icon: Home, end: true },
    { to: '/member/submit-emi', label: 'Submit EMI', icon: Wallet },
    { to: '/member/contributions', label: 'My Fund', icon: Wallet },
    { to: '/member/loans', label: 'My Loans', icon: BadgeIndianRupee },
    { to: '/member/directory', label: 'Members', icon: Users },
    { to: '/member/notifications', label: 'Notifications', icon: Bell },
    { to: '/member/profile', label: 'Profile', icon: User }
  ];

  const adminNav = [
    { to: '/admin', label: 'Dashboard', icon: Home, end: true },
    { to: '/admin/emi-submissions', label: 'EMI Submissions', icon: Wallet },
    { to: '/admin/members', label: 'Members', icon: Users },
    { to: '/admin/contributions', label: 'Contributions', icon: Wallet },
    { to: '/admin/fund', label: 'Fund Ledger', icon: TrendingUp },
    { to: '/admin/loan-requests', label: 'Loan Requests', icon: BadgeIndianRupee },
    { to: '/admin/loans', label: 'Active Loans', icon: BadgeIndianRupee },
    { to: '/admin/expenses', label: 'Expenses', icon: TrendingDown },
    { to: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert }
  ];

  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm print:hidden">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
        {isAdmin ? 'Admin Menu' : 'Member Menu'}
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
