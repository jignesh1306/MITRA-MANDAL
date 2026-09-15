import React from 'react';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const EMIList = ({ installments, onPay, isAdmin = false }) => {
  if (!installments || installments.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No EMI schedule available.</p>;
  }

  return (
    <div className="space-y-3">
      {installments.map((inst) => (
        <div 
          key={inst._id || inst.installmentNumber}
          className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
            inst.status === 'PAID' ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
              inst.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-700'
            }`}>
              #{inst.installmentNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{formatCurrency(inst.emi)}</span>
                <StatusBadge status={inst.status} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Due: {formatDate(inst.dueDate)} • Principal: {formatCurrency(inst.principal)} • Interest: {formatCurrency(inst.interest)}
              </p>
            </div>
          </div>

          {isAdmin && inst.status !== 'PAID' && onPay && (
            <button
              onClick={() => onPay(inst)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
            >
              ✓ Mark Paid
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
