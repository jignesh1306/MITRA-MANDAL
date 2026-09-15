import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Users, Search, ChevronRight, UserCheck, UserX } from 'lucide-react';

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
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    let url = `/members?search=${search}`;
    if (statusFilter !== 'ALL') {
      url += `&status=${statusFilter}`;
    }
    api.get(url)
      .then(res => setMembers(res.data))
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
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmittingApproval(true);
    try {
      await api.patch(`/members/${selectedMember._id}`, {
        status: 'ACTIVE',
        joiningDate: joiningDateInput,
        monthlyContribution: Number(monthlyContributionInput)
      });
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      alert(err.message);
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

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members Directory</h1>
            <p className="text-xs text-gray-500">Manage member registrations, approvals, and accounts.</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'ACTIVE', 'DISABLED'].map(status => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setSearchParams(status === 'ALL' ? {} : { status });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status === 'ALL' ? 'All Members' : status}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-semibold focus:border-brand-600 outline-hidden shadow-xs"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : members.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs font-semibold">
          No members found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <Link
              key={m._id}
              to={`/admin/members/${m._id}`}
              className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-brand-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-base">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{m.name}</h3>
                      <span className="text-[11px] text-gray-500">{m.phone} • {m.role}</span>
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-gray-600 mb-3">Email: {m.email}</p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                {m.status === 'PENDING' ? (
                  <button
                    onClick={(e) => openApprovalModal(m, e)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Accept / Approve Member
                  </button>
                ) : (
                  <>
                    <span className="text-[11px] text-gray-400 font-medium">Joined {new Date(m.joiningDate || m.createdAt).toLocaleDateString('en-IN')}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Approval Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Approve Member Request</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Set joining date and monthly contribution amount for <strong className="text-gray-900">{selectedMember.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Joining Month / Date</label>
                <input
                  type="date"
                  required
                  value={joiningDateInput}
                  onChange={(e) => setJoiningDateInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden transition-all"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Monthly contributions will be auto-generated from this date up to current month.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Contribution Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  step="100"
                  value={monthlyContributionInput}
                  onChange={(e) => setMonthlyContributionInput(e.target.value)}
                  placeholder="2000"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-brand-600 outline-hidden transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="w-1/2 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApproval}
                  className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {submittingApproval ? 'Approving...' : 'Confirm & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
