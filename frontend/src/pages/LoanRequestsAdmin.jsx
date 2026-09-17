import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  BadgeIndianRupee, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  Eye, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';

export const LoanRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'

  // Modal State for Admin Loan Approval & Transfer Screenshot Upload
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    let url = '/loans/requests';
    if (statusFilter !== 'ALL') {
      url += `?status=${statusFilter}`;
    }
    api.get(url)
      .then(res => setRequests(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const openApprovalModal = (req) => {
    setSelectedRequest(req);
    setProofFile(null);
    setProofPreview('');
    setErrorMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('File size exceeds 10MB limit.');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleConfirmApproval = async (override = false) => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setErrorMsg('');

    try {
      let transferProofUrl = '';
      if (proofFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', proofFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        transferProofUrl = uploadRes.data.url;
        setUploading(false);
      }

      await api.post(`/loans/requests/${selectedRequest._id}/approve`, { 
        override,
        transferProofUrl 
      });

      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      if (err.message && err.message.includes('Insufficient group fund') && !override) {
        if (confirm(`${err.message}\n\nDo you want to override and approve the loan anyway?`)) {
          handleConfirmApproval(true);
          return;
        }
      }
      setErrorMsg(err.message || 'Failed to approve loan.');
    } finally {
      setActionLoading(false);
      setUploading(false);
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

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-3.5 pb-4">
      {/* Compact Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <BadgeIndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Loan Applications & Approvals</h1>
            <p className="text-[11px] text-gray-500">Review member loan requests, upload disbursement proof, & approve</p>
          </div>
        </div>

        {/* Minimal Filter Tabs */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Vibrant Compact Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90">Pending Applications</span>
          <span className="text-xs sm:text-sm font-black mt-0.5 block">{pendingCount} Requests</span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90">Total Request Volume</span>
          <span className="text-xs sm:text-sm font-black mt-0.5 block">
            {formatCurrency(requests.reduce((acc, r) => acc + (r.amount || 0), 0))}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 text-white shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90">Applications Loaded</span>
          <span className="text-xs sm:text-sm font-black mt-0.5 block">{requests.length} Total</span>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : requests.length === 0 ? (
        <div className="p-6 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs font-medium">
          No loan applications found matching status "{statusFilter}".
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r._id} className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{r.memberId?.name}</h3>
                    <span className="text-[10px] text-gray-400 font-medium">
                      ({r.memberId?.phone || ''})
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Requested on {formatDate(r.createdAt || r.requestDate)} • Note: {r.note || 'Community Loan'}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Insufficient Fund Warning Banner */}
              {r.insufficientFundWarning && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Warning: Insufficient group fund balance to approve this loan.</span>
                </div>
              )}

              {/* Compact Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-gray-50 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block">Loan Amount</span>
                  <div className="font-extrabold text-gray-900">{formatCurrency(r.principal || r.amount)}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Tenure</span>
                  <div className="font-extrabold text-gray-900">{r.months} Months</div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Interest Rate</span>
                  <div className="font-extrabold text-gray-900">{r.interestRate}% ({r.interestType || 'REDUCING'})</div>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Est. Repayment</span>
                  <div className="font-extrabold text-amber-700">{formatCurrency(r.totalRepayment || r.calculation?.totalRepayment || (r.amount * 1.05))}</div>
                </div>
              </div>

              {/* Transfer Screenshot Preview if present */}
              {r.transferProofUrl && (
                <div className="p-2 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Disbursed Proof Uploaded
                  </span>
                  <a
                    href={r.transferProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> View Screenshot
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              {r.status === 'PENDING' && (
                <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => handleReject(r._id)}
                    className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => openApprovalModal(r)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Process Loan Approval
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADMIN LOAN APPROVAL & DISBURSEMENT VERIFICATION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-gray-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BadgeIndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Approve Loan Disbursement</h3>
                  <p className="text-[11px] font-semibold text-gray-500">Verify loan parameters & upload transfer proof screenshot</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* MEMBER & LOAN DATA DETAILS CARD */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/60 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-black text-amber-900">{selectedRequest.memberId?.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedRequest.memberId?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block">Requested Amount</span>
                  <div className="text-sm font-black text-amber-950">
                    {formatCurrency(selectedRequest.amount)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block">Loan Tenure</span>
                  <div className="text-xs font-extrabold text-amber-950">
                    {selectedRequest.months} Months Period
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block">Interest Rate</span>
                  <div className="text-xs font-extrabold text-amber-950">
                    {selectedRequest.interestRate}% ({selectedRequest.interestType || 'REDUCING'})
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block">Start Date</span>
                  <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-700" />
                    <span>Today ({formatDate(new Date())})</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block">Estimated End Date</span>
                  <div className="text-xs font-bold text-amber-950">
                    {formatDate(new Date(Date.now() + selectedRequest.months * 30 * 24 * 60 * 60 * 1000))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 block">Est. Repayment</span>
                  <div className="text-xs font-extrabold text-emerald-800">
                    {formatCurrency(selectedRequest.totalRepayment || selectedRequest.calculation?.totalRepayment || (selectedRequest.amount * 1.05))}
                  </div>
                </div>
              </div>
            </div>

            {/* SCREENSHOT UPLOAD SECTION */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-gray-800">
                Upload Payment Transfer Screenshot <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="p-4 border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl text-center bg-gray-50/50 transition-colors">
                {proofPreview ? (
                  <div className="space-y-2">
                    <img src={proofPreview} alt="Transfer Screenshot" className="max-h-40 mx-auto rounded-xl object-contain border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => { setProofFile(null); setProofPreview(''); }}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      Remove Screenshot
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 py-2">
                    <Upload className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs font-extrabold text-gray-800">Click to upload payment success screenshot</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, JPEG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex-1 py-2.5 text-xs font-extrabold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || uploading}
                onClick={() => handleConfirmApproval(false)}
                className="flex-1 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionLoading ? (uploading ? 'Uploading Proof...' : 'Approving Loan...') : 'Confirm & Approve Loan'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


