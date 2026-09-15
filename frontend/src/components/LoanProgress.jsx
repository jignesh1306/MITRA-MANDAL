import React from 'react';

export const LoanProgress = ({ percent }) => {
  const safePercent = Math.min(100, Math.max(0, percent || 0));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-xs font-semibold mb-1 text-gray-600">
        <span>Repayment Progress</span>
        <span>{safePercent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-brand-600 h-2.5 rounded-full transition-all duration-500" 
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
};
