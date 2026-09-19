import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoanProgress } from '../components/LoanProgress';
import { EMIList } from '../components/EMIList';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';

export const LoanDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDetails = () => {
    setLoading(true);
    api.get(`/loans/${id}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handlePayEMI = async (inst, componentType = 'FULL') => {
    try {
      await api.post(`/loans/installments/${inst._id}/pay`, { componentType });
      fetchDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6"><LoadingSkeleton count={4} /></div>;
  if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;
  if (!data) return null;

  const { loan, installments, summary } = data;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <BackButton fallback={isAdmin ? "/admin/loans" : "/member/loans"} label="Back to Loans" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <span className="text-xs text-gray-500 font-semibold">Loan Details</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(loan.principal)}</h1>
          <p className="text-xs text-gray-500 mt-1">Member: {loan.memberId?.name} • Purpose: {loan.purpose}</p>
        </div>
        <StatusBadge status={loan.status} />
      </div>

      {/* Loan Summary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Paid Principal</span>
          <div className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(summary.paidAmount)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Remaining Principal</span>
          <div className="text-lg font-bold text-brand-600 mt-1">{formatCurrency(summary.remainingPrincipal)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Total Interest</span>
          <div className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(loan.totalInterest)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-[11px] text-gray-500 font-semibold">Remaining Interest</span>
          <div className="text-lg font-bold text-gray-700 mt-1">{formatCurrency(summary.remainingInterest)}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200">
        <LoanProgress percent={summary.progressPercent} />
      </div>

      {/* EMI Schedule */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
        <h3 className="text-base font-bold text-gray-900">EMI Schedule</h3>
        <EMIList installments={installments} onPay={handlePayEMI} isAdmin={isAdmin} />
      </div>
    </div>
  );
};
