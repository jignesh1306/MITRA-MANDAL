import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { Users, Search, ChevronRight, UserCheck, UserX, Plus, Trash2, Calendar, BadgeIndianRupee, ShieldCheck, CheckCircle2, MessageCircle } from 'lucide-react';
import { generateMemberWhatsAppMessage, openWhatsApp } from '../utils/whatsappHelper';

export const MembersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [members, setMembers] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Approval Modal State
  const [selectedMember, setSelectedMember] = useState(null);
  const [joiningDateInput, setJoiningDateInput] = useState('2025-01-01');
  const [monthlyContributionInput, setMonthlyContributionInput] = useState('2000');
  const [markPastContributionsPaid, setMarkPastContributionsPaid] = useState(true);

  // Historical Past Completed Loans
  const [pastLoans, setPastLoans] = useState([]);

  // Historical Pre-Existing Running Loan
  const [hasRunningLoan, setHasRunningLoan] = useState(false);
  const [runningLoanData, setRunningLoanData] = useState({
    amount: '50000',
    months: '12',
    interestRate: '1.0',
    interestType: 'REDUCING',
    startDate: '2025-06-01'
  });

  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    let url = `/members?search=${search}`;
    if (statusFilter !== 'ALL') {
      url += `&status=${statusFilter}`;
    }
    api.get(url)
      .then(res => setMembers((res.data || []).filter(m => m.role !== 'ADMIN')))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, [search, statusFilter]);

  const openApprovalModal = (member, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMember(member);
    setJoiningDateInput('2025-01-01');
    setMonthlyContributionInput('2000');
    setMarkPastContributionsPaid(true);
    setPastLoans([]);
    setHasRunningLoan(false);
    setRunningLoanData({
      amount: '50000',
      months: '12',
      interestRate: '1.0',
      interestType: 'REDUCING',
      startDate: '2025-06-01'
    });
  };

  const addPastLoanField = () => {
    setPastLoans([
      ...pastLoans,
      {
        id: Date.now(),
        amount: '20000',
        months: '6',
        interestRate: '1.0',
        interestType: 'REDUCING',
        startDate: '2024-01-01'
      }
    ]);
  };

  const updatePastLoanField = (index, field, value) => {
    const updated = [...pastLoans];
    updated[index][field] = value;
    setPastLoans(updated);
  };

  const removePastLoanField = (index) => {
    setPastLoans(pastLoans.filter((_, i) => i !== index));
  };

  const calculateMonthsCount = (joiningDateStr) => {
    if (!joiningDateStr) return 0;
    const jDate = new Date(joiningDateStr);
    const now = new Date();
    const years = now.getFullYear() - jDate.getFullYear();
    const months = now.getMonth() - jDate.getMonth();
    return Math.max(1, (years * 12) + months + 1);
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmittingApproval(true);
    try {
      await api.patch(`/members/${selectedMember._id}`, {
        status: 'ACTIVE',
        joiningDate: joiningDateInput,
        monthlyContribution: Number(monthlyContributionInput),
        markPastContributionsPaid,
        pastLoans: pastLoans.map(p => ({
          amount: Number(p.amount),
          months: Number(p.months),
          interestRate: Number(p.interestRate),
          interestType: p.interestType,
          startDate: p.startDate
        })),
        runningLoan: hasRunningLoan ? {
          amount: Number(runningLoanData.amount),
          months: Number(runningLoanData.months),
          interestRate: Number(runningLoanData.interestRate),
          interestType: runningLoanData.interestType,
          startDate: runningLoanData.startDate
        } : null
      });
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to approve member.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleDisableMember = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.patch(`/members/${id}`, { status: 'DISABLED' });
      fetchMembers();
    } catch (err) {
      alert(err.message);
    }
  };

  const monthsCount = calculateMonthsCount(joiningDateInput);
  const totalRegularEmiCalculated = monthsCount * (Number(monthlyContributionInput) || 2000);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members Directory</h1>
            <p className="text-xs text-gray-500">Manage member registrations, approvals, backdated regular EMIs & past loans.</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-semibold focus:border-brand-600 outline-hidden shadow-xs"
        />
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : members.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs font-semibold">
          No members found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const hasLoan = m.loanSummary?.hasActiveLoan;
            const isFundPaid = m.currentContribution?.status === 'PAID';

            return (
              <div
                key={m._id}
                className="p-5 bg-white rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
              >
                <Link
                  to={`/admin/members/${m._id}`}
                  className="block space-y-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 font-extrabold flex items-center justify-center text-base shrink-0 border border-brand-100">
                      {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                          {m.name}
                        </h3>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.phone} {m.email ? `• ${m.email}` : ''}</p>
                    </div>
                  </div>

                  {/* Quick Financial Snapshot Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-lg font-bold ${
                      isFundPaid 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      ફંડ: {isFundPaid ? 'ચૂકવેલ' : 'બાકી'}
                    </span>

                    {hasLoan ? (
                      <span className="px-2 py-0.5 rounded-lg font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        લોન: {formatCurrency(m.loanSummary.remainingPrincipal)} બાકી
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg font-medium bg-gray-50 text-gray-500 border border-gray-100">
                        કોઈ લોન નથી
                      </span>
                    )}
                  </div>
                </Link>

                {/* Bottom Actions Bar */}
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  {/* WhatsApp Message Button */}
                  <button
                    type="button"
                    title="WhatsApp પર હિસાબ મોકલો"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const msg = generateMemberWhatsAppMessage(m);
                      openWhatsApp(m.phone, msg);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    <span>WhatsApp હિસાબ</span>
                  </button>

                  {/* Detail link icon button */}
                  <Link
                    to={`/admin/members/${m._id}`}
                    title="સભ્યની સંપૂર્ણ વિગત જુઓ"
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {m.status === 'PENDING' && (
                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={(e) => openApprovalModal(m, e)}
                      className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      Approve Member
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* COMPREHENSIVE HISTORICAL MEMBER APPROVAL & ONBOARDING MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-gray-100 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-brand-500 to-indigo-600 text-white rounded-2xl shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Historical Member Onboarding</h3>
                  <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                    Configure joining date, regular EMIs & loans for <strong className="text-brand-700">{selectedMember.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              
              {/* SECTION 1: Joining Month & Regular EMI Calculation */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200/60">
                  <div className="p-1 bg-amber-500 text-white rounded-md">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider block">
                    1. Joining Month & Backdated Regular EMI
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Joining Month / Year</label>
                    <input
                      type="date"
                      required
                      value={joiningDateInput}
                      onChange={(e) => setJoiningDateInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-extrabold text-gray-900 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Monthly Contribution (₹)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="100"
                      value={monthlyContributionInput}
                      onChange={(e) => setMonthlyContributionInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-extrabold text-gray-900 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Auto Calculated Highlight Card */}
                <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wide block">Total Duration ({monthsCount} Months)</span>
                    <span className="text-base font-black text-amber-950 mt-0.5 block">₹{totalRegularEmiCalculated.toLocaleString('en-IN')} Total Regular EMI</span>
                  </div>
                  <label className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markPastContributionsPaid}
                      onChange={(e) => setMarkPastContributionsPaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-black text-emerald-800">Mark Pre-Paid</span>
                  </label>
                </div>
              </div>

              {/* SECTION 2: Multiple Past Completed Loans */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-violet-500/10 border border-violet-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1 border-b border-violet-200/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-violet-600 text-white rounded-md shrink-0">
                      <BadgeIndianRupee className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-violet-950 uppercase tracking-wider block">
                      2. Past Completed Loans History
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addPastLoanField}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap self-end sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Past Loan
                  </button>
                </div>

                {pastLoans.length > 0 && (
                  <div className="space-y-3">
                    {pastLoans.map((pl, idx) => (
                      <div key={pl.id} className="p-3.5 bg-white rounded-xl border border-violet-200 space-y-2.5 shadow-2xs relative">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="text-xs font-black text-violet-900">Completed Loan #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removePastLoanField(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Amount (₹)</label>
                            <input
                              type="number"
                              value={pl.amount}
                              onChange={(e) => updatePastLoanField(idx, 'amount', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-violet-200 rounded-lg text-xs font-black text-gray-900 focus:border-violet-600 outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Tenure (Mo)</label>
                            <input
                              type="number"
                              value={pl.months}
                              onChange={(e) => updatePastLoanField(idx, 'months', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-violet-200 rounded-lg text-xs font-black text-gray-900 focus:border-violet-600 outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Rate (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={pl.interestRate}
                              onChange={(e) => updatePastLoanField(idx, 'interestRate', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-violet-200 rounded-lg text-xs font-black text-gray-900 focus:border-violet-600 outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Start Date</label>
                            <input
                              type="date"
                              value={pl.startDate}
                              onChange={(e) => updatePastLoanField(idx, 'startDate', e.target.value)}
                              className="w-full px-2 py-1 border border-violet-200 rounded-lg text-xs font-bold text-gray-900 focus:border-violet-600 outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: Current Pre-Existing Running Loan */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1 border-b border-emerald-200/60">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-600 text-white rounded-md shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                      3. Current / Ongoing Pre-Existing Loan
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-emerald-200 cursor-pointer whitespace-nowrap self-end sm:self-auto">
                    <input
                      type="checkbox"
                      checked={hasRunningLoan}
                      onChange={(e) => setHasRunningLoan(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm border-gray-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-black text-emerald-900 whitespace-nowrap">Has Active Loan</span>
                  </label>
                </div>

                {hasRunningLoan && (
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs shadow-2xs">
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Amount (₹)</label>
                      <input
                        type="number"
                        value={runningLoanData.amount}
                        onChange={(e) => setRunningLoanData({ ...runningLoanData, amount: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs font-black text-gray-900 focus:border-emerald-600 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Tenure (Mo)</label>
                      <input
                        type="number"
                        value={runningLoanData.months}
                        onChange={(e) => setRunningLoanData({ ...runningLoanData, months: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs font-black text-gray-900 focus:border-emerald-600 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={runningLoanData.interestRate}
                        onChange={(e) => setRunningLoanData({ ...runningLoanData, interestRate: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg text-xs font-black text-gray-900 focus:border-emerald-600 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold text-gray-600 block mb-0.5">Start Date</label>
                      <input
                        type="date"
                        value={runningLoanData.startDate}
                        onChange={(e) => setRunningLoanData({ ...runningLoanData, startDate: e.target.value })}
                        className="w-full px-2 py-1 border border-emerald-200 rounded-lg text-xs font-bold text-gray-900 focus:border-emerald-600 outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* MODAL ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="w-full sm:w-1/2 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproval}
                  className="w-full sm:w-1/2 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submittingApproval ? 'Processing...' : 'Confirm & Onboard Member'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
