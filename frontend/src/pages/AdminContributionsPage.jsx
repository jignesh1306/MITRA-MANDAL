import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Wallet, CheckCircle2, ChevronLeft, Trash2,
  AlertTriangle, User, CreditCard, TrendingUp, Zap
} from 'lucide-react';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function ConfirmDeleteDialog({ onConfirm, onCancel, label }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">Delete Entry?</h3>
        </div>
        <p className="text-xs text-gray-600 mb-5 leading-relaxed">
          This will <strong className="text-red-600">permanently delete</strong> the <em>{label}</em> record
          and any linked transaction. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 rounded-xl text-xs font-bold text-white hover:bg-red-700 transition-colors"
          >
            Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Entry Row (single EMI / installment card) ───────────────────────────────
function EntryCard({ icon: Icon, iconBg, iconColor, label, sublabel, amount, status, isPaid, onMarkPaid, onDelete, markingPaid, deleting }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteDialog
          label={label}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => { setShowConfirm(false); onDelete(); }}
        />
      )}
      <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">{label}</p>
              {sublabel && <p className="text-[10px] text-gray-500 leading-tight">{sublabel}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={status} />
            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleting}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
              title="Delete permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Amount row */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <span className="text-[11px] text-gray-500 font-medium">Amount</span>
          <span className="text-xs font-extrabold text-gray-900">{formatCurrency(amount)}</span>
        </div>

        {/* Paid info or Mark Paid button */}
        {isPaid ? (
          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Paid — recorded
          </span>
        ) : (
          <button
            onClick={onMarkPaid}
            disabled={markingPaid}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {markingPaid ? 'Saving...' : 'Mark as Paid'}
          </button>
        )}
      </div>
    </>
  );
}

// ─── Member Detail View ──────────────────────────────────────────────────────
function MemberDetailView({ member, month, year, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});  // tracks which entry id is in-flight

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/contributions/member/${member._id}?month=${month}&year=${year}`, { skipCache: true });
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, [member._id, month, year]);

  const setEntryBusy = (id, flag) => setBusy(prev => ({ ...prev, [id]: flag }));

  const handleMarkEMIPaid = async (id) => {
    setEntryBusy(id, true);
    try {
      await api.post(`/contributions/${id}/mark-paid`);
      await fetchEntries();
    } catch (err) {
      alert(err.message);
    } finally {
      setEntryBusy(id, false);
    }
  };

  const handleDeleteEMI = async (id) => {
    setEntryBusy(id, true);
    try {
      await api.delete(`/contributions/${id}`);
      await fetchEntries();
    } catch (err) {
      alert(err.message);
    } finally {
      setEntryBusy(id, false);
    }
  };

  // Uses the correct loan service endpoint — atomic, prevents duplicate transactions
  const handleMarkInstallmentPaid = async (id) => {
    setEntryBusy(id, true);
    try {
      await api.post(`/loans/installments/${id}/pay`, { componentType: 'FULL' });
      await fetchEntries();
    } catch (err) {
      alert(err.message);
    } finally {
      setEntryBusy(id, false);
    }
  };

  const handleDeleteInstallment = async (id) => {
    setEntryBusy(id, true);
    try {
      await api.delete(`/contributions/installment/${id}`);
      await fetchEntries();
    } catch (err) {
      alert(err.message);
    } finally {
      setEntryBusy(id, false);
    }
  };

  const totalDue = (() => {
    if (!data) return 0;
    let t = 0;
    if (data.regularEMI) t += data.regularEMI.amount || 0;
    (data.loanInstallments || []).forEach(i => { t += i.emi || 0; });
    (data.overdueInstallments || []).forEach(i => { t += i.emi || 0; });
    return t;
  })();

  const totalPaid = (() => {
    if (!data) return 0;
    let t = 0;
    if (data.regularEMI?.status === 'PAID') t += data.regularEMI.amount || 0;
    (data.loanInstallments || []).filter(i => i.status === 'PAID').forEach(i => { t += i.emi || 0; });
    (data.overdueInstallments || []).filter(i => i.status === 'PAID').forEach(i => { t += i.emi || 0; });
    return t;
  })();

  return (
    <div className="space-y-3.5">
      {/* Back button + member header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 mb-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Members
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center text-base flex-shrink-0">
            {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">{member.name}</h2>
            <p className="text-[11px] text-gray-500">{member.phone}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <p className="text-gray-500 mb-0.5">Total Due</p>
            <p className="font-extrabold text-gray-900">{formatCurrency(totalDue)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100">
            <p className="text-emerald-600 mb-0.5">Total Paid</p>
            <p className="font-extrabold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* ── Regular EMI ── */}
          <div>
            <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Regular Monthly EMI
            </p>
            {data?.regularEMI ? (
              <EntryCard
                icon={Wallet}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                label="Monthly Regular EMI"
                sublabel={`${MONTH_NAMES[month - 1]} ${year}`}
                amount={data.regularEMI.amount}
                status={data.regularEMI.status}
                isPaid={data.regularEMI.status === 'PAID'}
                markingPaid={!!busy[data.regularEMI._id]}
                deleting={!!busy[data.regularEMI._id]}
                onMarkPaid={() => handleMarkEMIPaid(data.regularEMI._id)}
                onDelete={() => handleDeleteEMI(data.regularEMI._id)}
              />
            ) : (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-4 text-center text-xs text-gray-400">
                No regular EMI record for this month
              </div>
            )}
          </div>

          {/* ── Loan EMI Installments (this month) ── */}
          {(data?.loanInstallments?.length > 0) && (
            <div>
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-2 px-1">
                Loan EMI &amp; Interest — {MONTH_NAMES[month - 1]} {year}
              </p>
              <div className="space-y-2.5">
                {data.loanInstallments.map((inst) => (
                  <EntryCard
                    key={inst._id}
                    icon={CreditCard}
                    iconBg="bg-purple-100"
                    iconColor="text-purple-600"
                    label={`Loan EMI — Installment #${inst.installmentNumber}`}
                    sublabel={
                      `Principal: ${formatCurrency(inst.principal)} · Interest: ${formatCurrency(inst.interest)}` +
                      (inst.loanPurpose ? ` · ${inst.loanPurpose}` : '')
                    }
                    amount={inst.emi}
                    status={inst.status}
                    isPaid={inst.status === 'PAID'}
                    markingPaid={!!busy[inst._id]}
                    deleting={!!busy[inst._id]}
                    onMarkPaid={() => handleMarkInstallmentPaid(inst._id)}
                    onDelete={() => handleDeleteInstallment(inst._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Overdue / Penalty Installments ── */}
          {(data?.overdueInstallments?.length > 0) && (
            <div>
              <p className="text-[11px] font-extrabold text-red-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Overdue / Pending from Past Months
              </p>
              <div className="space-y-2.5">
                {data.overdueInstallments.map((inst) => (
                  <EntryCard
                    key={inst._id}
                    icon={TrendingUp}
                    iconBg="bg-red-100"
                    iconColor="text-red-600"
                    label={`Overdue EMI — Installment #${inst.installmentNumber}`}
                    sublabel={
                      `Due: ${formatDate(inst.dueDate)} · Principal: ${formatCurrency(inst.principal)} · Interest: ${formatCurrency(inst.interest)}` +
                      (inst.loanPurpose ? ` · ${inst.loanPurpose}` : '')
                    }
                    amount={inst.emi}
                    status={inst.status}
                    isPaid={inst.status === 'PAID'}
                    markingPaid={!!busy[inst._id]}
                    deleting={!!busy[inst._id]}
                    onMarkPaid={() => handleMarkInstallmentPaid(inst._id)}
                    onDelete={() => handleDeleteInstallment(inst._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!data?.regularEMI && !data?.loanInstallments?.length && !data?.overdueInstallments?.length && (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-8 text-center text-xs text-gray-400">
              No entries found for {member.name} in {MONTH_NAMES[month - 1]} {year}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export const AdminContributionsPage = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchContribs = () => {
    setLoading(true);
    api.get(`/contributions?month=${month}&year=${year}`, { skipCache: true })
      .then(res => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContribs();
    setSelectedMember(null); // reset drill-down on month/year change
  }, [month, year]);

  const paidCount = list.filter(c => c.status === 'PAID').length;
  const pendingCount = list.filter(c => c.status !== 'PAID').length;
  const totalCollected = list
    .filter(c => c.status === 'PAID')
    .reduce((acc, c) => acc + (c.amount || 0), 0);

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-3.5 pb-4">

      {/* Header & Month/Year selector */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Monthly Contributions</h1>
            <p className="text-[11px] text-gray-500">Track regular EMI member payments</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={month}
            onChange={(e) => { setMonth(Number(e.target.value)); setSelectedMember(null); }}
            className="w-1/2 sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden transition-all cursor-pointer"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => { setYear(Number(e.target.value)); setSelectedMember(null); }}
            className="w-1/2 sm:w-auto px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden transition-all cursor-pointer"
          >
            {[2024, 2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-blue-100 uppercase tracking-wider opacity-90">Total Members</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{list.length} Members</span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-wider opacity-90">Paid</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{paidCount} Members</span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-wider opacity-90">Pending</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{pendingCount} Members</span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-sm flex flex-col justify-between space-y-1">
          <span className="text-[10px] font-extrabold text-purple-100 uppercase tracking-wider opacity-90">Total Collected</span>
          <span className="text-xs sm:text-sm font-black tracking-tight">{formatCurrency(totalCollected)}</span>
        </div>
      </div>

      {/* ── Detail view OR member list ── */}
      {selectedMember ? (
        <MemberDetailView
          member={selectedMember}
          month={month}
          year={year}
          onBack={() => { setSelectedMember(null); fetchContribs(); }}
        />
      ) : (
        <>
          {loading ? (
            <LoadingSkeleton count={4} />
          ) : list.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs font-medium">
              No registered active members found for {MONTH_NAMES[month - 1]} {year}.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {list.map((item) => {
                const isPaid = item.status === 'PAID';
                const memberObj = item.memberId || {};
                return (
                  <button
                    key={item._id}
                    onClick={() => setSelectedMember(memberObj)}
                    className="text-left p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col justify-between gap-2.5 hover:border-brand-400 hover:shadow-md active:scale-[0.99] transition-all duration-150 cursor-pointer"
                  >
                    {/* Member row */}
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {memberObj.name ? memberObj.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{memberObj.name || 'Member'}</h4>
                          <p className="text-[10px] text-gray-500">{memberObj.phone || ''}</p>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* EMI amount */}
                    <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 text-xs">
                      <span className="text-gray-500 text-[11px] font-medium">Monthly Regular EMI:</span>
                      <span className="font-extrabold text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>

                    {isPaid ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Paid on {item.paidAt ? formatDate(item.paidAt) : 'Recorded'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-brand-600 font-bold flex items-center gap-1 pt-0.5">
                        <User className="w-3 h-3" /> Tap to view &amp; manage entries →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
