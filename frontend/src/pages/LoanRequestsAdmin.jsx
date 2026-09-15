import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BadgeIndianRupee, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export const LoanRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = () => {
    setLoading(true);
    api.get('/loans/requests?status=PENDING')
      .then(res => setRequests(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id, override = false) => {
    try {
      await api.post(`/loans/requests/${id}/approve`, { override });
      fetchRequests();
    } catch (err) {
      if (confirm(`${err.message}\n\nDo you want to override and approve the loan anyway?`)) {
        handleApprove(id, true);
      }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Specify Rejection Reason:', 'Rejected due to internal group rules');
    if (!reason) return;
    try {
      await api.post(`/loans/requests/${id}/reject`, { rejectionReason: reason });
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-6"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
          <BadgeIndianRupee className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Requests</h1>
          <p className="text-xs text-gray-500">Review pending member loan applications.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs font-semibold">
          No pending loan requests.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="p-6 rounded-3xl bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{r.memberId?.name}</h3>
                  <p className="text-xs text-gray-500">Requested: {formatDate(r.createdAt)} • Purpose: {r.purpose}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Insufficient Fund Warning Banner */}
              {r.insufficientFundWarning && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Insufficient group fund balance to approve this loan.</span>
                </div>
              )}

              {/* Loan Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-gray-50 text-xs">
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <div className="font-bold text-gray-900">{formatCurrency(r.amount)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="font-bold text-gray-900">{r.months} Months</div>
                </div>
                <div>
                  <span className="text-gray-500">Interest Rate:</span>
                  <div className="font-bold text-gray-900">{r.interestRate}% ({r.interestType})</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Repayment:</span>
                  <div className="font-bold text-brand-700">{formatCurrency(r.calculation?.totalRepayment)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleReject(r._id)}
                  className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(r._id)}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
