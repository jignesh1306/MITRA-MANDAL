import React from 'react';

export const MoneyCard = ({ title, amount, subtitle, icon: Icon, badge, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
    emerald: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
    purple: 'bg-gradient-to-br from-purple-600 to-indigo-800 text-white',
    white: 'bg-white text-gray-900 border border-gray-100 shadow-sm'
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-90">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">{amount}</div>
        {subtitle && <p className="mt-1 text-xs opacity-80">{subtitle}</p>}
      </div>
      {badge && <div className="mt-3">{badge}</div>}
    </div>
  );
};
