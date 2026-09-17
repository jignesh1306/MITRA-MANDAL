import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { BackButton } from '../components/BackButton';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  BadgeIndianRupee, 
  Wallet, 
  Calendar, 
  User, 
  FileText, 
  Image as ImageIcon,
  Calculator
} from 'lucide-react';

export const SubmitEMIPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [includeRegular, setIncludeRegular] = useState(true);
  const [regularAmount, setRegularAmount] = useState(2000); // Default ₹2,000

  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoanData, setActiveLoanData] = useState(null);

  const [includeLoanPrincipal, setIncludeLoanPrincipal] = useState(false);
  const [loanPrincipalAmount, setLoanPrincipalAmount] = useState(0);

  const [includeLoanInterest, setIncludeLoanInterest] = useState(false);
  const [loanInterestAmount, setLoanInterestAmount] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    // Fetch active loan data for current user if any
    api.get('/loans?status=ACTIVE')
      .then(res => {
        const myLoan = res.data.find(l => l.memberId?._id === user._id || l.memberId === user._id);
        if (myLoan) {
          setHasActiveLoan(true);
          setActiveLoanData(myLoan);
          
          // Calculate estimated principal & interest for next installment
          const estimatedPrincipal = Math.round(myLoan.principal / (myLoan.months * 100)) || 5000;
          const estimatedInterest = Math.round(myLoan.totalInterest / (myLoan.months * 100)) || 500;
          
          setLoanPrincipalAmount(estimatedPrincipal);
          setLoanInterestAmount(estimatedInterest);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user._id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size exceeds 10MB limit.');
        return;
      }
      setError('');
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const calculatedTotal = 
    (includeRegular ? Number(regularAmount || 0) : 0) +
    (includeLoanPrincipal ? Number(loanPrincipalAmount || 0) : 0) +
    (includeLoanInterest ? Number(loanInterestAmount || 0) : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!includeRegular && !includeLoanPrincipal && !includeLoanInterest) {
      return setError('Please select at least one EMI payment component (Regular Fund, Loan Principal, or Loan Interest).');
    }

    if (calculatedTotal <= 0) {
      return setError('Total payment amount must be greater than ₹0.');
    }

    if (!selectedFile) {
      return setError('Please upload a payment successful screenshot proof image.');
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('month', selectedMonth);
    formData.append('year', selectedYear);
    formData.append('includeRegularEMI', includeRegular);
    formData.append('regularAmount', regularAmount);
    formData.append('includeLoanPrincipal', includeLoanPrincipal);
    formData.append('loanPrincipalAmount', loanPrincipalAmount);
    formData.append('includeLoanInterest', includeLoanInterest);
    formData.append('loanInterestAmount', loanInterestAmount);
    if (activeLoanData) {
      formData.append('loanId', activeLoanData._id);
    }
    formData.append('note', note);
    formData.append('proofImage', selectedFile);

    try {
      await api.post('/emi-submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMsg('EMI payment submission sent successfully! Admin will review your payment proof.');
      setTimeout(() => {
        navigate('/member/contributions');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit EMI payment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-6">
        <LoadingSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 pb-4">
      <BackButton fallback="/member" label="Back to Dashboard" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-tr from-brand-600 to-indigo-600 text-white rounded-2xl shadow-md">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Submit Your EMI</h1>
          <p className="text-xs text-gray-500">Submit your monthly fund contribution or loan EMI with payment proof</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Member Details Info Banner */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 font-bold flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Member Name</span>
              <p className="font-extrabold text-gray-900 text-sm mt-0.5">{user.name}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 font-bold flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Select Month & Year</span>
              <div className="flex gap-2 mt-0.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-900"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-900"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Payment Selection & Screenshot Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
          <Calculator className="w-4 h-4 text-brand-600" />
          Select Payment Components
        </h3>

        <div className="space-y-3">
          {/* Option 1: Regular Monthly Fund EMI */}
          <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
            includeRegular 
              ? 'bg-brand-50/60 border-brand-300 shadow-xs' 
              : 'bg-gray-50 border-gray-200 opacity-80'
          }`}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={includeRegular}
                onChange={(e) => setIncludeRegular(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded-md focus:ring-brand-500"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">Regular Monthly Fund Contribution</span>
                <span className="text-[11px] text-gray-500 font-medium">Standard monthly group fund deposit</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-brand-700">₹{regularAmount.toLocaleString('en-IN')}</span>
            </div>
          </label>

          {/* Option 2 & 3: Active Loan Options if member has active loan */}
          {hasActiveLoan && (
            <>
              {/* Option 2: Loan Principal EMI */}
              <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                includeLoanPrincipal 
                  ? 'bg-emerald-50/60 border-emerald-300 shadow-xs' 
                  : 'bg-gray-50 border-gray-200 opacity-80'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeLoanPrincipal}
                    onChange={(e) => setIncludeLoanPrincipal(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Loan Principal EMI</span>
                    <span className="text-[11px] text-gray-500 font-medium">Principal repayment towards active loan</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-700">₹{loanPrincipalAmount.toLocaleString('en-IN')}</span>
                </div>
              </label>

              {/* Option 3: Loan Interest Amount */}
              <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                includeLoanInterest 
                  ? 'bg-amber-50/60 border-amber-300 shadow-xs' 
                  : 'bg-gray-50 border-gray-200 opacity-80'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeLoanInterest}
                    onChange={(e) => setIncludeLoanInterest(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Loan Interest Amount</span>
                    <span className="text-[11px] text-gray-500 font-medium">Monthly interest charge on active loan</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-amber-700">₹{loanInterestAmount.toLocaleString('en-IN')}</span>
                </div>
              </label>
            </>
          )}
        </div>

        {/* Auto-Calculated Total Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex justify-between items-center shadow-md">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100">Total Payable Amount</span>
            <p className="text-xs text-brand-100 mt-0.5">Auto-calculated based on your selections</p>
          </div>
          <div className="text-2xl font-black">
            ₹{calculatedTotal.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Payment Proof Screenshot Upload Section */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-900">
            Upload Payment Successful Screenshot <span className="text-red-500">*</span>
          </label>
          
          <div className="border-2 border-dashed border-gray-200 hover:border-brand-400 rounded-2xl p-6 text-center bg-slate-50/50 transition-all relative">
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {filePreview ? (
              <div className="flex flex-col items-center space-y-2">
                <img src={filePreview} alt="Payment Proof Preview" className="max-h-48 rounded-xl border border-gray-200 shadow-sm object-contain" />
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Screenshot attached ({selectedFile?.name})
                </span>
                <span className="text-[10px] text-gray-400">Click to replace image</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-700">Click or Drag & Drop Payment Screenshot</p>
                <p className="text-[10px] text-gray-400">Supported formats: PNG, JPG, JPEG, WEBP (Max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-700">Additional Note (Optional)</label>
          <textarea
            rows="2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add any message or transaction ref number for Admin..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? 'Uploading Proof & Submitting...' : 'Submit Payment Request to Admin'}
        </button>
      </form>
    </div>
  );
};
