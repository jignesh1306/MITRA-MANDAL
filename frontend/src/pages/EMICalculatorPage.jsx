import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Calculator, Table, ShieldCheck, Sparkles, AlertCircle, ArrowRight, Printer, FileText } from 'lucide-react';
import { BackButton } from '../components/BackButton';

// Client-side fallback calculator matching reducing balance / flat logic
const computeLocalSchedule = (principalRupees, monthsNum, monthlyRatePercent = 1.0, interestType = 'REDUCING') => {
  const principalPaise = Math.max(1000, Number(principalRupees) || 50000) * 100;
  const mNum = Math.max(1, Number(monthsNum) || 10);
  const r = Number(monthlyRatePercent) / 100;

  let totalInterestPaise = 0;
  let remainingPrincipalPaise = principalPaise;
  const schedule = [];

  if (interestType === 'FLAT') {
    const monthlyInterest = Math.round(principalPaise * r);
    const monthlyPrincipal = Math.round(principalPaise / mNum);
    totalInterestPaise = monthlyInterest * mNum;

    for (let i = 1; i <= mNum; i++) {
      const p = (i === mNum) ? remainingPrincipalPaise : monthlyPrincipal;
      const emi = p + monthlyInterest;
      remainingPrincipalPaise = Math.max(0, remainingPrincipalPaise - p);
      schedule.push({
        month: i,
        principal: p,
        interest: monthlyInterest,
        emi: emi,
        remainingPrincipal: remainingPrincipalPaise
      });
    }
  } else {
    // REDUCING balance
    const monthlyPrincipal = Math.round(principalPaise / mNum);
    for (let i = 1; i <= mNum; i++) {
      const interest = Math.round(remainingPrincipalPaise * r);
      totalInterestPaise += interest;
      const p = (i === mNum) ? remainingPrincipalPaise : monthlyPrincipal;
      const emi = p + interest;
      remainingPrincipalPaise = Math.max(0, remainingPrincipalPaise - p);
      schedule.push({
        month: i,
        principal: p,
        interest,
        emi,
        remainingPrincipal: remainingPrincipalPaise
      });
    }
  }

  const totalRepayment = principalPaise + totalInterestPaise;
  const averageEMI = Math.round(totalRepayment / mNum);

  return {
    principal: principalPaise,
    totalInterest: totalInterestPaise,
    totalRepayment,
    averageEMI,
    schedule
  };
};

export const EMICalculatorPage = () => {
  const [amount, setAmount] = useState(50000);
  const [amountInput, setAmountInput] = useState('50000');
  const [months, setMonths] = useState(10);
  
  const [groupSettings, setGroupSettings] = useState({
    interestRate: 1.0,
    interestType: 'REDUCING'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Sync slider
  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setAmount(val);
    setAmountInput(String(val));
  };

  // Sync number input
  const handleAmountInputChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setAmountInput('');
      setAmount(0);
      return;
    }
    const cleaned = valStr.replace(/^0+(?=\d)/, '');
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      setAmountInput(cleaned);
      setAmount(num);
    }
  };

  const handleAmountInputBlur = () => {
    const num = parseInt(amountInput, 10);
    if (!amountInput || isNaN(num) || num < 1000) {
      setAmount(5000);
      setAmountInput('5000');
    } else if (num > 1000000) {
      setAmount(1000000);
      setAmountInput('1000000');
    }
  };

  const executeCalculation = async () => {
    setLoading(true);
    const targetAmount = Number(amountInput) || amount || 50000;
    const targetMonths = Number(months) || 10;

    try {
      const res = await api.post('/calculator/loan', {
        amount: targetAmount,
        months: targetMonths
      });

      if (res.data && res.data.schedule) {
        setResult(res.data);
        if (res.data.groupSettings) {
          setGroupSettings(res.data.groupSettings);
        }
      } else {
        const localData = computeLocalSchedule(targetAmount, targetMonths, groupSettings.interestRate, groupSettings.interestType);
        setResult(localData);
      }
    } catch (err) {
      console.warn('API calculator request error, using client calculation fallback', err);
      const localData = computeLocalSchedule(targetAmount, targetMonths, groupSettings.interestRate, groupSettings.interestType);
      setResult(localData);
    } finally {
      setHasCalculated(true);
      setLoading(false);
    }
  };

  // Auto calculate on initial load
  useEffect(() => {
    executeCalculation();
  }, []);

  const handleCalculateSubmit = (e) => {
    if (e) e.preventDefault();
    executeCalculation();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto px-4 py-3 sm:py-6 space-y-3 sm:space-y-5 print:py-0 print:px-0 print:max-w-full print:space-y-4"
    >
      {/* Printable Report Header (Visible ONLY in Print / PDF mode) */}
      <div className="hidden print:block border-b-2 border-gray-900 pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight font-gujarati">મિત્ર-મંડળ (Mitra-Mandal)</h1>
            <p className="text-sm font-bold text-gray-700">Official Loan EMI Calculation Report</p>
          </div>
          <div className="text-right text-xs font-semibold text-gray-600">
            <p>Date: {formatDate(new Date())}</p>
            <p className="mt-0.5">Rate: {groupSettings.interestRate}% ({groupSettings.interestType})</p>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <BackButton fallback="/" label="Back" />
      </div>

      {/* Page Header (Screen Only) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-2xl shadow-md">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EMI Calculator</h1>
            <p className="text-xs text-gray-500">Calculate loan EMI, interest, and monthly repayment schedules.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block print:space-y-4">
        {/* Controls Card (Hidden in Print / PDF Mode) */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 print:hidden"
        >
          <form onSubmit={handleCalculateSubmit} className="space-y-6">
            {/* Loan Amount Control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>Loan Amount</span>
                <span className="font-bold text-brand-600 text-sm">{formatCurrency(Number(amountInput) || amount, true)}</span>
              </div>
              
              <input
                type="range"
                min="5000"
                max="500000"
                step="5000"
                value={amount || 50000}
                onChange={handleSliderChange}
                className="w-full cursor-pointer accent-brand-600"
              />
              
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5">
                <span>₹5,000</span>
                <span>₹5,00,000</span>
              </div>

              {/* Input Box */}
              <div className="pt-1">
                <label className="block text-[11px] font-medium text-gray-500 mb-1">Enter Exact Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    value={amountInput}
                    onChange={handleAmountInputChange}
                    onBlur={handleAmountInputBlur}
                    placeholder="50000"
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-bold focus:border-brand-600 focus:bg-brand-50/20 outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Duration Control */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>Duration</span>
                <span className="font-bold text-brand-600 text-sm">{months} Months</span>
              </div>
              <input
                type="range"
                min="1"
                max="36"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5">
                <span>1 Month</span>
                <span>36 Months</span>
              </div>
            </div>

            {/* Admin Configured Interest Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-brand-700 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Admin Interest Configuration</span>
              </div>
              <p className="text-[11px] text-brand-900 font-medium leading-relaxed">
                Rate: <span className="font-bold text-brand-700">{groupSettings.interestRate}%</span> per month
              </p>
              <p className="text-[10px] text-brand-600 font-semibold">
                Type: {groupSettings.interestType === 'REDUCING' ? 'Monthly Reducing Balance' : 'Flat Rate'}
              </p>
            </div>

            {/* Calculate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              {loading ? 'Calculating...' : 'Calculate EMI'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>

        {/* Loan Summary & Monthly Table (Full Width in Print Mode) */}
        <div className="lg:col-span-2 space-y-6 print:space-y-4">
          {!hasCalculated || loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col items-center justify-center space-y-3 print:hidden">
              <div className="p-4 bg-brand-50 text-brand-600 rounded-full">
                <Calculator className="w-8 h-8 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-gray-600">
                {loading ? 'Calculating loan EMI & interest breakdown...' : 'Click "Calculate EMI" to see the full breakdown.'}
              </p>
            </div>
          ) : result ? (
            <>
              {/* Summary Header with Print / Download PDF Button */}
              <div className="flex items-center justify-between print:hidden">
                <h3 className="text-sm font-bold text-gray-900">Calculation Summary</h3>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs print:p-2.5 print:border-gray-300">
                  <span className="text-[11px] text-gray-500 font-semibold print:text-black">Principal Amount</span>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1 print:text-base print:text-black">{formatCurrency(result.principal)}</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs print:p-2.5 print:border-gray-300">
                  <span className="text-[11px] text-gray-500 font-semibold print:text-black">Total Interest</span>
                  <div className="text-lg sm:text-xl font-bold text-amber-600 mt-1 print:text-base print:text-black">{formatCurrency(result.totalInterest)}</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs print:p-2.5 print:border-gray-300">
                  <span className="text-[11px] text-gray-500 font-semibold print:text-black">Total Repayment</span>
                  <div className="text-lg sm:text-xl font-bold text-brand-600 mt-1 print:text-base print:text-black">{formatCurrency(result.totalRepayment)}</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs print:p-2.5 print:border-gray-300">
                  <span className="text-[11px] text-gray-500 font-semibold print:text-black">Average EMI</span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 print:text-base print:text-black">{formatCurrency(result.averageEMI)}</div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs print:rounded-none print:border-gray-300">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print:p-2.5 print:bg-white">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 print:text-xs">
                    <Table className="w-4 h-4 text-brand-600 print:hidden" />
                    Monthly Repayment Schedule
                  </h3>
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full print:text-black print:bg-transparent print:p-0">
                    {result.schedule?.length || 0} Installments
                  </span>
                </div>

                <div className="w-full overflow-x-hidden">
                  <table className="w-full text-left text-[11px] sm:text-xs table-fixed print:text-[10px]">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100 print:bg-gray-100 print:text-black">
                      <tr>
                        <th className="w-[10%] px-1 py-2 sm:px-3 sm:py-3 text-center print:py-1">#</th>
                        <th className="w-[22.5%] px-1 py-2 sm:px-3 sm:py-3 print:py-1">Principal</th>
                        <th className="w-[22.5%] px-1 py-2 sm:px-3 sm:py-3 print:py-1">Interest</th>
                        <th className="w-[22.5%] px-1 py-2 sm:px-3 sm:py-3 print:py-1">EMI</th>
                        <th className="w-[22.5%] px-1 py-2 sm:px-3 sm:py-3 print:py-1">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium print:divide-gray-300">
                      {result.schedule?.map((row) => (
                        <tr key={row.month} className="hover:bg-brand-50/20 transition-colors print:hover:bg-transparent">
                          <td className="px-1 py-2 sm:px-3 sm:py-2.5 font-bold text-gray-900 text-center print:py-1 print:text-black">{row.month}</td>
                          <td className="px-1 py-2 sm:px-3 sm:py-2.5 text-gray-700 truncate print:py-1 print:text-black">{formatCurrency(row.principal)}</td>
                          <td className="px-1 py-2 sm:px-3 sm:py-2.5 text-amber-600 font-semibold truncate print:py-1 print:text-black">{formatCurrency(row.interest)}</td>
                          <td className="px-1 py-2 sm:px-3 sm:py-2.5 text-brand-700 font-bold truncate print:py-1 print:text-black">{formatCurrency(row.emi)}</td>
                          <td className="px-1 py-2 sm:px-3 sm:py-2.5 text-gray-500 font-mono truncate print:py-1 print:text-black">{formatCurrency(row.remainingPrincipal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};
