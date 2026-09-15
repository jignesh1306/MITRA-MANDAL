import React, { useState } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { FileText, Download, PieChart, Wallet, BadgeIndianRupee, TrendingDown } from 'lucide-react';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('fund');
  const [fundData, setFundData] = useState(null);
  const [contribData, setContribData] = useState(null);
  const [loanData, setLoanData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = (tab) => {
    setActiveTab(tab);
    setLoading(true);
    if (tab === 'fund') {
      api.get('/reports/fund').then(res => setFundData(res.data)).finally(() => setLoading(false));
    } else if (tab === 'contributions') {
      api.get('/reports/contributions').then(res => setContribData(res.data)).finally(() => setLoading(false));
    } else if (tab === 'loans') {
      api.get('/reports/loans').then(res => setLoanData(res.data)).finally(() => setLoading(false));
    } else if (tab === 'expenses') {
      api.get('/reports/expenses').then(res => setExpenseData(res.data)).finally(() => setLoading(false));
    }
  };

  React.useEffect(() => {
    fetchReport('fund');
  }, []);

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'fund' && fundData) {
      csvContent += 'ReferenceId,Date,Type,Category,Amount,Description\n';
      fundData.transactions.forEach(t => {
        csvContent += `${t.referenceId},${formatDate(t.date)},${t.type},${t.category},${t.amount / 100},"${t.description}"\n`;
      });
    } else if (activeTab === 'contributions' && contribData) {
      csvContent += 'Member,Email,Phone,TotalPaid\n';
      contribData.forEach(m => {
        csvContent += `"${m.name}",${m.email},${m.phone},${m.totalPaid / 100}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mitra_mandal_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-xs text-gray-500">Fund, contribution, loan, and expense report breakdowns.</p>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'fund', label: 'Fund Report', icon: Wallet },
          { id: 'contributions', label: 'Contribution Report', icon: PieChart },
          { id: 'loans', label: 'Loan Report', icon: BadgeIndianRupee },
          { id: 'expenses', label: 'Expense Report', icon: TrendingDown }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => fetchReport(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === t.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Report Data Views */}
      {activeTab === 'fund' && fundData && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-2xl">
              <span className="text-xs text-emerald-700 font-semibold">Total Income</span>
              <div className="text-xl font-bold text-emerald-800">{formatCurrency(fundData.totalIncome)}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl">
              <span className="text-xs text-red-700 font-semibold">Total Expenses</span>
              <div className="text-xl font-bold text-red-800">{formatCurrency(fundData.totalExpenses)}</div>
            </div>
            <div className="p-4 bg-brand-50 rounded-2xl">
              <span className="text-xs text-brand-700 font-semibold">Net Fund Balance</span>
              <div className="text-xl font-bold text-brand-800">{formatCurrency(fundData.netBalance)}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contributions' && contribData && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-gray-100">
            {contribData.map((m, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-gray-900">{m.name}</h4>
                  <span className="text-[10px] text-gray-500">{m.email}</span>
                </div>
                <div className="font-bold text-emerald-600 text-sm">
                  Total Paid: {formatCurrency(m.totalPaid)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
