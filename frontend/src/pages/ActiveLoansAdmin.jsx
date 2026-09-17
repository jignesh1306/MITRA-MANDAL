import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { LoanProgress } from '../components/LoanProgress';
import { formatCurrency } from '../utils/formatters';
import { BadgeIndianRupee, ChevronRight, ArrowUpRight, Plus, CheckCircle2, ShieldCheck, Calendar, X } from 'lucide-react';

export const ActiveLoansAdmin = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExtraInterestModal, setShowExtraInterestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State - Add Historical Loan
  const [memberId, setMemberId] = useState('');
  const [loanType, setLoanType] = useState('COMPLETED'); // 'COMPLETED' or 'RUNNING'
  const [amount, setAmount] = useState('50000');
  const [months, setMonths] = useState('12');
  const [interestRate, setInterestRate] = useState('1.0');
  const [interestType, setInterestType] = useState('REDUCING');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [note, setNote] = useState('');

  // Form State - Extra Interest / Penalty
  const [extraMemberId, setExtraMemberId] = useState('');
  const [extraAmount, setExtraAmount] = useState('500');
  const [extraDescription, setExtraDescription] = useState('Extra Interest / Penalty charge');

  const fetchLoansAndMembers = () => {
    setLoading(true);
    Promise.all([
      api.get('/loans'),
      api.get('/members')
    ])
      .then(([loansRes, membersRes]) => {
        setLoans(loansRes.data || []);
        const activeM = (membersRes.data || []).filter(m => m.role !== 'ADMIN');
        setMembers(activeM);
        if (activeM.length > 0) {
          if (!memberId) setMemberId(activeM[0]._id);
          if (!extraMemberId) setExtraMemberId(activeM[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoansAndMembers();
  }, []);

  const handleAddLoan = async (e) => {
    e.preventDefault();
    if (!memberId || !amount || !months) return;
    setSubmitting(true);
    try {
      await api.post('/loans/direct-historical', {
        memberId,
        type: loanType,
        amount: Number(amount),
        months: Number(months),
        interestRate: Number(interestRate),
        interestType,
        startDate,
        note
      });
      setShowAddModal(false);
      fetchLoansAndMembers();
    } catch (err) {
      alert(err.message || 'Failed to add loan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExtraInterest = async (e) => {
    e.preventDefault();
    if (!extraMemberId || !extraAmount) return;
    setSubmitting(true);
    try {
      const res = await api.post('/loans/extra-interest', {
        memberId: extraMemberId,
        amount: Number(extraAmount),
        description: extraDescription
      });
      alert(res.data.message || 'Extra Interest / Penalty added successfully!');
      setShowExtraInterestModal(false);
      fetchLoansAndMembers();
    } catch (err) {
      alert(err.message || 'Failed to add extra interest/penalty.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 max-w-4xl mx-auto"><LoadingSkeleton count={3} /></div>;

  const activeLoansCount = loans.filter(l => l.status === 'ACTIVE').length;
  const totalPrincipalDisbursed = loans.reduce((acc, l) => acc + (l.principal || 0), 0);

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-3.5 pb-4">
      {/* Compact Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <BadgeIndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Active & Completed Community Loans</h1>
            <p className="text-[11px] text-gray-500 leading-tight">Monitor running loans, total principal, interest rates & repayment progress</p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex-1 min-w-[130px] px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Past Loan</span>
          </button>

          <button
            type="button"
            onClick={() => setShowExtraInterestModal(true)}
            className="flex-1 min-w-[130px] px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Extra Interest</span>
          </button>

          <Link
            to="/admin/loan-requests"
            className="flex-1 min-w-[130px] px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center justify-center gap-1.5 text-center"
          >
            <span>Pending Applications</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Vibrant Compact Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 truncate">Active Loans</span>
          <span className="text-sm font-black mt-0.5 block">{activeLoansCount} Active</span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 truncate">Total Disbursed</span>
          <span className="text-sm font-black mt-0.5 block">{formatCurrency(totalPrincipalDisbursed)}</span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 truncate">Total Loans</span>
          <span className="text-sm font-black mt-0.5 block">{loans.length} Loans Total</span>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs font-medium">
          No loan records found.
        </div>
      ) : (
        <div className="space-y-3">
          {loans.map(loan => {
            const summary = loan.summary || {};
            const isCompleted = loan.status === 'COMPLETED';
            const remainingP = isCompleted ? 0 : (summary.remainingPrincipal ?? loan.principal);
            const remainingI = isCompleted ? 0 : (summary.remainingInterest ?? (loan.totalInterest || 0));

            return (
              <div
                key={loan._id}
                className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3 hover:border-brand-300 transition-all"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                      {loan.memberId?.name ? loan.memberId.name.charAt(0) : 'M'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-gray-900 truncate">{loan.memberId?.name || 'Member'}</h3>
                      <p className="text-[10px] text-gray-500 truncate">
                        {loan.months} Months • {loan.interestRate}% Monthly ({loan.interestType || 'REDUCING'})
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-gray-50 text-xs">
                  <div>
                    <span className="text-gray-400 text-[10px] block">Original Principal</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(loan.principal)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">Remaining Principal</span>
                    <span className={`font-extrabold ${remainingP === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                      {formatCurrency(remainingP)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">Total Interest</span>
                    <span className="font-extrabold text-rose-700">{formatCurrency(loan.totalInterest || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] block">Total Repayment</span>
                    <span className="font-extrabold text-indigo-900">{formatCurrency(loan.totalRepayment || (loan.principal + (loan.totalInterest || 0)))}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="flex-1 max-w-[70%]">
                    <LoanProgress percent={isCompleted ? 100 : (summary.progressPercent || 0)} />
                  </div>
                  <Link
                    to={`/member/loans/${loan._id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 shrink-0"
                  >
                    <span>Installments</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* ADD HISTORICAL / PAST LOAN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-gray-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add Historical / Past Loan</h3>
                  <p className="text-[11px] text-gray-500">Add past completed loan or ongoing active loan directly for any member</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLoan} className="space-y-3.5">
              {/* Member Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Member</label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden"
                >
                  {members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Loan Type / Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanType('COMPLETED')}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      loanType === 'COMPLETED'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Past Completed Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType('RUNNING')}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all ${
                      loanType === 'RUNNING'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Ongoing / Active Loan
                  </button>
                </div>
              </div>

              {/* Amount & Tenure */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Loan Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Interest Rate & Start Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Interest Rate (%)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Remarks / Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Added historical offline loan"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Add Loan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXTRA INTEREST / PENALTY MODAL */}
      {showExtraInterestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <BadgeIndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Add Extra Interest / Penalty</h3>
                  <p className="text-[11px] text-gray-500">Record fine or extra EMI interest charge added to total group balance</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExtraInterestModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExtraInterest} className="space-y-3.5">
              {/* Member Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Member</label>
                <select
                  required
                  value={extraMemberId}
                  onChange={(e) => setExtraMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-purple-600 outline-hidden"
                >
                  {members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Extra Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Extra Interest / Penalty Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-purple-600 outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason / Description</label>
                <input
                  type="text"
                  required
                  value={extraDescription}
                  onChange={(e) => setExtraDescription(e.target.value)}
                  placeholder="e.g. Late EMI penalty charge"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-purple-600 outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExtraInterestModal(false)}
                  className="w-1/2 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Adding...' : 'Add Penalty / EMI'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

