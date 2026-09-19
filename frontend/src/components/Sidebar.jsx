import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Home, Users, Wallet, BadgeIndianRupee, TrendingUp, TrendingDown, 
  FileText, Settings, ShieldAlert, Bell, User
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const memberNav = [
    { to: '/member', label: t('nav.dashboard'), icon: Home, end: true },
    { to: '/member/submit-emi', label: t('nav.submitEmi'), icon: Wallet },
    { to: '/member/contributions', label: t('nav.myFund'), icon: Wallet },
    { to: '/member/loans', label: t('nav.myLoans'), icon: BadgeIndianRupee },
    { to: '/member/directory', label: t('nav.members'), icon: Users },
    { to: '/member/notifications', label: t('nav.notifications'), icon: Bell },
    { to: '/member/profile', label: t('nav.profile'), icon: User }
  ];

  const adminNav = [
    { to: '/admin', label: t('nav.dashboard'), icon: Home, end: true },
    { to: '/admin/notifications', label: t('nav.notifications'), icon: Bell },
    { to: '/admin/emi-submissions', label: t('nav.emiSubmissions'), icon: Wallet },
    { to: '/admin/members', label: t('nav.members'), icon: Users },
    { to: '/admin/contributions', label: t('nav.contributions'), icon: Wallet },
    { to: '/admin/fund', label: t('nav.fundLedger'), icon: TrendingUp },
    { to: '/admin/loan-requests', label: t('nav.loanRequests'), icon: BadgeIndianRupee },
    { to: '/admin/loans', label: t('nav.activeLoans'), icon: BadgeIndianRupee },
    { to: '/admin/expenses', label: t('nav.expenses'), icon: TrendingDown },
    { to: '/admin/revenue', label: t('nav.revenue'), icon: TrendingUp },
    { to: '/admin/reports', label: t('nav.reports'), icon: FileText },
    { to: '/admin/settings', label: t('nav.settings'), icon: Settings },
    { to: '/admin/audit-logs', label: t('nav.auditLogs'), icon: ShieldAlert }
  ];

  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-4rem)] p-4 shadow-sm print:hidden">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
        {isAdmin ? t('nav.adminMenu') : t('nav.memberMenu')}
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
