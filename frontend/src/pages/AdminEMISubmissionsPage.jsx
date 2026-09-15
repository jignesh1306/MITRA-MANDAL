import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { BackButton } from '../components/BackButton';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  User, 
  BadgeIndianRupee,
  FileText
} from 'lucide-react';

export const AdminEMISubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'
  const [loading, setLoading] = useState(true);

  // Selected Submission Modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = () => {
    setLoading(true);
    let url = '/emi-submissions';
    if (statusFilter !== 'ALL') {
      url += `?status=${statusFilter}`;
    }
    api.get(url)
      .then(res => setSubmissions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const handleApprove = async (sub) => {
    if (!window.confirm(`Approve payment of ${formatCurrency(sub.totalAmount)} for ${sub.memberId?.name}? This will update group balances and delete the screenshot from Cloudinary to save storage.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`/emi-submissions/${sub._id}/approve`);
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err) {
      alert(err.message || 'Failed to approve submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      await api.patch(`/emi-submissions/${selectedSub._id}/reject`, { reason: rejectionReason });
      setShowRejectModal(false);
      setSelectedSub(null);
      fetchSubmissions();
    } catch (err) {
      alert(err.message || 'Failed to reject submission.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <BackButton fallback="/admin" label="Back to Dashboard" />

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">EMI Payment Submissions</h1>
            <p className="text-xs text-gray-500">Review member EMI screenshots, approve payments, and auto-delete proof images</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs w-fit">
        {[
          { id: 'PENDING', label: 'Pending Approval' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: 'ALL', label: 'All Submissions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : submissions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs font-semibold">
          No payment submissions found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((sub) => (
            <div
              key={sub._id}
              className="p-5 rounded-3xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm shrink-0">
                    {sub.memberId?.name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-gray-900 truncate">{sub.memberId?.name}</h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {sub.memberId?.phone} • Month {sub.month}/{sub.year}
                    </p>
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              {/* Breakdown Summary */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Regular Fund EMI:</span>
                  <span className="font-bold text-gray-900">
                    {sub.includeRegularEMI ? formatCurrency(sub.regularAmount) : 'Not Included'}
                  </span>
                </div>
                {sub.includeLoanPrincipal && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Loan Principal:</span>
                    <span className="font-bold">{formatCurrency(sub.loanPrincipalAmount)}</span>
                  </div>
                )}
                {sub.includeLoanInterest && (
                  <div className="flex justify-between items-center text-amber-700">
                    <span>Loan Interest:</span>
                    <span className="font-bold">{formatCurrency(sub.loanInterestAmount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-brand-700">
                  <span>Total Amount Submitted:</span>
                  <span>{formatCurrency(sub.totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedSub(sub)}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-4 h-4 text-brand-600" />
                  Inspect Screenshot
                </button>

                {sub.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleApprove(sub)}
                      disabled={actionLoading}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => { setSelectedSub(sub); setShowRejectModal(true); setRejectionReason(''); }}
                      disabled={actionLoading}
                      className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Screenshot & Details Modal */}
      {selectedSub && !showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 border border-gray-200 shadow-2xl">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">Payment Submission Proof</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedSub.memberId?.name} • {formatCurrency(selectedSub.totalAmount)}</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Image Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 block">Uploaded Payment Screenshot (Cloudinary):</span>
              <div className="p-2 rounded-2xl bg-gray-900 flex items-center justify-center min-h-[200px]">
                {selectedSub.proofImageUrl ? (
                  <img src={selectedSub.proofImageUrl} alt="Payment Proof" className="max-h-80 object-contain rounded-xl" />
                ) : (
                  <p className="text-xs text-gray-400">Screenshot already deleted from Cloudinary after approval.</p>
                )}
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Note: Upon Admin approval or rejection, this image file will be permanently destroyed on Cloudinary to save storage.
              </p>
            </div>

            {/* Note */}
            {selectedSub.note && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs">
                <span className="font-bold text-amber-900 block">Member Note:</span>
                <p className="text-amber-800 mt-0.5">{selectedSub.note}</p>
              </div>
            )}

            {/* Modal Footer Actions */}
            {selectedSub.status === 'PENDING' && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  className="w-1/2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedSub)}
                  disabled={actionLoading}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  Approve & Delete Proof Image
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-gray-900">Reject EMI Payment Request</h3>
            <p className="text-xs text-gray-500">Provide a reason for rejecting this payment submission:</p>

            <textarea
              rows="3"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid payment screenshot or payment not received in account."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
