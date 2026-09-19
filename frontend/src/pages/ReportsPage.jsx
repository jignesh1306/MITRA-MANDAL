import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { FileText, ArrowLeft, Download, Printer, Wallet, BadgeIndianRupee, TrendingUp, Landmark, ShieldAlert, CircleDollarSign } from 'lucide-react';

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    api.get('/reports/fund')
      .then(res => setReportData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportCSV = () => {
    if (!reportData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Financial Metric,Value (in INR)\n';
    csvContent += `Total Current Balance,${(reportData.totalCurrentBalance || 0) / 100}\n`;
    csvContent += `No. of Running Loans,${reportData.runningLoansCount || 0}\n`;
    csvContent += `Running Loans Amount,${(reportData.runningLoanAmount || 0) / 100}\n`;
    csvContent += `Total Regular EMI Collected,${(reportData.totalRegularEmi || 0) / 100}\n`;
    csvContent += `Total Loan EMI Principal Collected,${(reportData.totalLoanEmi || 0) / 100}\n`;
    csvContent += `Total Interest Collected,${(reportData.totalInterest || 0) / 100}\n`;
    csvContent += `Total Extra Interest / Penalty Collected,${(reportData.totalExtraInterestPenalty || 0) / 100}\n`;
    csvContent += `Final Total Current Amount in Bank,${(reportData.totalBankBalance || 0) / 100}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mitra_mandal_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePDF = () => {
    window.print();
  };

  const currentDate = new Date();
  const dateFormatted = currentDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const monthYearFormatted = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4">
        <div className="h-10 bg-gray-200 animate-pulse rounded-2xl w-1/3"></div>
        <div className="h-64 bg-gray-100 animate-pulse rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-5 pb-4">
      
      {/* EXCLUSIVE PDF / PRINT HEADER BANNER */}
      <div className="hidden print:flex items-center justify-between pb-4 mb-4 border-b-2 border-gray-900">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Mitra-Mandal Logo" className="w-14 h-14 object-contain" />
          <div>
            <h1 className="text-2xl font-black text-gray-900 font-gujarati tracking-wide">મિત્ર-મંડળ (Mitra-Mandal)</h1>
            <p className="text-xs font-bold text-gray-600">Savings & Credit Association • Official Financial Report</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black text-gray-900 uppercase">Report Month: <span className="text-blue-700">{monthYearFormatted}</span></div>
          <div className="text-[11px] font-bold text-gray-500 mt-0.5">Generated On: {dateFormatted}</div>
        </div>
      </div>

      {/* Screen Header with Back Button & Action Controls */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-2xl transition-all cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Financial Reports</h1>
            <p className="text-[11px] font-semibold text-gray-500">Comprehensive fund breakdown & bank position</p>
          </div>
        </div>

        {/* Action Button: Save PDF */}
        <div className="w-full sm:w-auto">
          <button
            onClick={handleSavePDF}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Save as PDF
          </button>
        </div>
      </div>

      {/* FINANCIAL REPORT METRICS CARDS */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-md space-y-4">
        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-gray-700">Financial Overview Summary</h2>
          <span className="text-[10px] font-bold text-gray-400">Live Updated</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          
          {/* 1. Total Current Balance */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide block">Total Current Balance</span>
              <div className="text-lg font-black text-amber-900 mt-1">
                {formatCurrency(reportData?.totalCurrentBalance || 0)}
              </div>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* 2. No. of Running Loans */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wide block">No. of Running Loans</span>
              <div className="text-lg font-black text-blue-900 mt-1">
                {reportData?.runningLoansCount || 0} Active Loans
              </div>
            </div>
            <div className="p-3 bg-blue-500 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          {/* 3. Running Loan Amount */}
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-violet-900 uppercase tracking-wide block">Running Loans Amount</span>
              <div className="text-lg font-black text-violet-900 mt-1">
                {formatCurrency(reportData?.runningLoanAmount || 0)}
              </div>
            </div>
            <div className="p-3 bg-violet-500 text-white rounded-xl shadow-xs">
              <BadgeIndianRupee className="w-5 h-5" />
            </div>
          </div>

          {/* 4. Total Regular EMI */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wide block">Total Regular EMI</span>
              <div className="text-lg font-black text-emerald-900 mt-1">
                {formatCurrency(reportData?.totalRegularEmi || 0)}
              </div>
            </div>
            <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-xs">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* 5. Loan EMI */}
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wide block">Loan EMI (Principal Repaid)</span>
              <div className="text-lg font-black text-teal-900 mt-1">
                {formatCurrency(reportData?.totalLoanEmi || 0)}
              </div>
            </div>
            <div className="p-3 bg-teal-500 text-white rounded-xl shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* 6. Total Interest Collected */}
          <div className="p-4 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-200/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-fuchsia-900 uppercase tracking-wide block">Total Interest Collected</span>
              <div className="text-lg font-black text-fuchsia-900 mt-1">
                {formatCurrency(reportData?.totalInterest || 0)}
              </div>
            </div>
            <div className="p-3 bg-fuchsia-500 text-white rounded-xl shadow-xs">
              <BadgeIndianRupee className="w-5 h-5" />
            </div>
          </div>

          {/* 7. Total Extra Interest / Penalty Collected */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-200/60 flex items-center justify-between col-span-1 sm:col-span-2">
            <div>
              <span className="text-[11px] font-extrabold text-purple-900 uppercase tracking-wide block">Total Extra Interest / Penalty</span>
              <div className="text-lg font-black text-purple-900 mt-1">
                {formatCurrency(reportData?.totalExtraInterestPenalty || 0)}
              </div>
            </div>
            <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs">
              <BadgeIndianRupee className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* 7. FINAL TOTAL CURRENT AMOUNT IN BANK */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md mt-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-blue-100">Final Total Current Amount in Bank</span>
            <div className="text-2xl font-black mt-0.5">
              {formatCurrency(reportData?.totalBankBalance || 0)}
            </div>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur-md text-white rounded-xl">
            <Landmark className="w-7 h-7" />
          </div>
        </div>

      </div>
    </div>
  );
};

