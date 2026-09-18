import React from 'react';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const EMIList = ({ installments, onPay, isAdmin = false }) => {
  if (!installments || installments.length === 0) {
    return <p className="text-gray-500 text-sm py-4">No EMI schedule available.</p>;
  }

  return (
    <div className="space-y-4">
      {installments.map((inst) => {
        const paidP = inst.paidPrincipal || (inst.status === 'PAID' ? inst.principal : 0);
        const paidI = inst.paidInterest || (inst.status === 'PAID' ? inst.interest : 0);

        const isPrincipalPaid = paidP >= inst.principal;
        const isInterestPaid = paidI >= inst.interest;
        const isFullyPaid = inst.status === 'PAID' || (isPrincipalPaid && isInterestPaid);

        return (
          <div 
            key={inst._id || inst.installmentNumber}
            className={`p-4 rounded-2xl border bg-white shadow-xs transition-all space-y-3 ${
              isFullyPaid 
                ? 'border-emerald-200 bg-emerald-50/20' 
                : inst.status === 'PARTIALLY_PAID' 
                  ? 'border-amber-200 bg-amber-50/20' 
                  : 'border-gray-200'
            }`}
          >
            {/* Header: Number, Total Amount & Badge */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  isFullyPaid 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : inst.status === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-brand-50 text-brand-700'
                }`}>
                  #{inst.installmentNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-gray-900">{formatCurrency(inst.emi)}</span>
                    <StatusBadge status={inst.status} />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                    Due Date: <span className="font-bold text-gray-700">{formatDate(inst.dueDate)}</span>
                  </p>
                </div>
              </div>

              {/* Quick Summary Pill */}
              <div className="text-right">
                {isFullyPaid ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800">
                    સંપૂર્ણ ચૂકવેલ (Fully Settled)
                  </span>
                ) : (
                  <span className="text-xs text-amber-800 font-extrabold">
                    બાકી રકમ: {formatCurrency(Math.max(0, (inst.principal - paidP) + (inst.interest - paidI)))}
                  </span>
                )}
              </div>
            </div>

            {/* SEPARATE 2 DATA DIVS: 1. Loan Principal (મુદ્દલ) & 2. Loan Interest (વ્યાજ) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              
              {/* 1. Loan Principal Block */}
              <div className={`p-3 rounded-xl border flex justify-between items-center ${
                isPrincipalPaid 
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                  : 'bg-slate-50 border-slate-200 text-gray-800'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                    ૧. લોન મુદ્દલ હપ્તો (Principal EMI)
                  </span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {formatCurrency(inst.principal)}
                  </span>
                </div>
                <div className="text-right">
                  {isPrincipalPaid ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ✓ ચૂકવેલ (Paid)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">
                      બાકી (Pending)
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Loan Interest Block */}
              <div className={`p-3 rounded-xl border flex justify-between items-center ${
                isInterestPaid 
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50/40 border-amber-200 text-amber-900'
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
                    ૨. લોન વ્યાજ રકમ (Interest Amount)
                  </span>
                  <span className="text-sm font-extrabold text-gray-900">
                    {formatCurrency(inst.interest)}
                  </span>
                </div>
                <div className="text-right">
                  {isInterestPaid ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ✓ ચૂકવેલ (Paid)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                      બાકી (Pending)
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Admin Payment Actions (Separate or Full) */}
            {isAdmin && !isFullyPaid && onPay && (
              <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
                {/* Pay Only Interest Button */}
                {!isInterestPaid && (
                  <button
                    type="button"
                    onClick={() => onPay(inst, 'INTEREST')}
                    className="px-3 py-1.5 text-xs font-extrabold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                  >
                    ✓ વ્યાજ જમા કરો ({formatCurrency(inst.interest)})
                  </button>
                )}

                {/* Pay Only Principal Button */}
                {!isPrincipalPaid && (
                  <button
                    type="button"
                    onClick={() => onPay(inst, 'PRINCIPAL')}
                    className="px-3 py-1.5 text-xs font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
                  >
                    ✓ મુદ્દલ જમા કરો ({formatCurrency(inst.principal)})
                  </button>
                )}

                {/* Pay Both (Full EMI) Button */}
                <button
                  type="button"
                  onClick={() => onPay(inst, 'FULL')}
                  className="px-4 py-1.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ✓ સંપૂર્ણ EMI જમા ({formatCurrency(Math.max(0, (inst.principal - paidP) + (inst.interest - paidI)))})
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
