import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Home, Wallet, BadgeIndianRupee, User, Users, Settings } from 'lucide-react';

export const BottomNav = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const memberLinks = [
    { to: '/member', label: t('nav.home'), icon: Home, end: true },
    { to: '/member/contributions', label: t('nav.myFund'), icon: Wallet },
    { to: '/member/loans', label: t('loan.title'), icon: BadgeIndianRupee },
    { to: '/member/directory', label: t('nav.members'), icon: Users },
    { to: '/member/profile', label: t('nav.profile'), icon: User }
  ];

  const adminLinks = [
    { to: '/admin', label: t('nav.dashboard'), icon: Home, end: true },
    { to: '/admin/members', label: t('nav.members'), icon: Users },
    { to: '/admin/contributions', label: t('nav.contributions'), icon: Wallet },
    { to: '/admin/loans', label: t('loan.title'), icon: BadgeIndianRupee },
    { to: '/admin/settings', label: t('nav.settings'), icon: Settings }
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  const isLinkActive = (link) => {
    if (link.end) {
      return location.pathname === link.to || location.pathname === `${link.to}/`;
    }
    return location.pathname.startsWith(link.to);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 px-2 py-2 shadow-2xl print:hidden">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link);

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 text-[11px] font-extrabold transition-colors select-none group min-w-[56px]"
            >
              {/* Glassmorphism Active Round Pill Background */}
              {isActive && (
                <motion.div
                  layoutId="activeGlassBackground"
                  className="absolute inset-0 bg-gradient-to-b from-brand-500/15 via-indigo-500/15 to-brand-600/20 backdrop-blur-md rounded-2xl border border-brand-500/30 shadow-md shadow-brand-500/15"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              {/* Icon and Label Container */}
              <motion.div
                animate={{
                  scale: isActive ? 1.12 : 1,
                  y: isActive ? -1 : 0
                }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative z-10 flex flex-col items-center justify-center"
              >
                <Icon className={`w-5 h-5 mb-0.5 transition-colors duration-200 shrink-0 ${
                  isActive 
                    ? 'text-brand-600 fill-brand-600/10' 
                    : 'text-gray-600 group-hover:text-gray-900'
                }`} />
                <span className={`transition-colors duration-200 whitespace-nowrap ${
                  isActive 
                    ? 'text-brand-700 font-black' 
                    : 'text-gray-600 group-hover:text-gray-900'
                }`}>
                  {link.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
