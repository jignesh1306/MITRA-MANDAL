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
  const currentActualMonth = now.getMonth() + 1;
  const currentActualYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentActualMonth);
  const [selectedYear, setSelectedYear] = useState(currentActualYear);

  const [includeRegular, setIncludeRegular] = useState(true);
  const [regularAmount, setRegularAmount] = useState(2000); // Default ₹2,000

  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoanData, setActiveLoanData] = useState(null);

  const [includeLoanPrincipal, setIncludeLoanPrincipal] = useState(false);
  const [loanPrincipalAmount, setLoanPrincipalAmount] = useState(0);

  const [includeLoanInterest, setIncludeLoanInterest] = useState(false);
  const [loanInterestAmount, setLoanInterestAmount] = useState(0);

  // Status records from backend
  const [allContributions, setAllContributions] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch all user contributions, active loans and pending submissions
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/loans/my').catch(() => ({ data: [] })),
      api.get('/contributions/my').catch(() => ({ data: [] })),
      api.get('/emi-submissions').catch(() => ({ data: [] }))
    ])
      .then(([loansRes, contribsRes, subRes]) => {
        // Set contributions
        setAllContributions(contribsRes.data || []);
        setMySubmissions(subRes.data || []);

        // Find active running loan
        const activeLoan = (loansRes.data || []).find(l => l.status === 'ACTIVE' || l.status === 'APPROVED');
        if (activeLoan) {
          setHasActiveLoan(true);
          setActiveLoanData(activeLoan);

          // Find next pending installment if available
          const nextPendingInst = (activeLoan.installments || []).find(i => i.status !== 'PAID');
          if (nextPendingInst) {
            setLoanPrincipalAmount(Math.round(nextPendingInst.principal / 100));
            setLoanInterestAmount(Math.round(nextPendingInst.interest / 100));
          } else {
            const estP = Math.round(activeLoan.principal / (activeLoan.months * 100)) || 5000;
            const estI = Math.round(activeLoan.totalInterest / (activeLoan.months * 100)) || 500;
            setLoanPrincipalAmount(estP);
            setLoanInterestAmount(estI);
          }
        } else {
          setHasActiveLoan(false);
          setActiveLoanData(null);
        }
      })
      .finally(() => setLoading(false));
  }, [user._id]);

  // Determine Month Category: PAST, FUTURE, or CURRENT
  const isPast = selectedYear < currentActualYear || (selectedYear === currentActualYear && selectedMonth < currentActualMonth);
  const isFuture = selectedYear > currentActualYear || (selectedYear === currentActualYear && selectedMonth > currentActualMonth);
  const isCurrent = selectedYear === currentActualYear && selectedMonth === currentActualMonth;

  // Track which components for current month are already paid or pending
  const matchingContrib = allContributions.find(c => c.month === selectedMonth && c.year === selectedYear);
  const isRegularAlreadyPaid = matchingContrib?.status === 'PAID';

  const nextDueInst = (activeLoanData?.installments || []).find(i => i.status !== 'PAID');
  const isLoanPrincipalAlreadyPaid = nextDueInst ? (nextDueInst.paidPrincipal >= nextDueInst.principal) : !hasActiveLoan;
  const isLoanInterestAlreadyPaid = nextDueInst ? (nextDueInst.paidInterest >= nextDueInst.interest) : !hasActiveLoan;

  // Remaining unpaid amounts for current installment
  const remainingPrincipalDue = nextDueInst ? Math.max(0, Math.round((nextDueInst.principal - (nextDueInst.paidPrincipal || 0)) / 100)) : 0;
  const remainingInterestDue = nextDueInst ? Math.max(0, Math.round((nextDueInst.interest - (nextDueInst.paidInterest || 0)) / 100)) : 0;

  const matchingSubmission = mySubmissions.find(s => s.month === selectedMonth && s.year === selectedYear);
  const isSubmissionPending = matchingSubmission && matchingSubmission.status === 'PENDING';

  // Everything is fully settled if regular fund is paid AND active loan (if any) principal + interest are paid
  const isEverythingPaid = isRegularAlreadyPaid && (!hasActiveLoan || (isLoanPrincipalAlreadyPaid && isLoanInterestAlreadyPaid));

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
    (includeRegular && !isRegularAlreadyPaid ? Number(regularAmount || 0) : 0) +
    (includeLoanPrincipal && !isLoanPrincipalAlreadyPaid ? Number(remainingPrincipalDue || loanPrincipalAmount || 0) : 0) +
    (includeLoanInterest && !isLoanInterestAlreadyPaid ? Number(remainingInterestDue || loanInterestAmount || 0) : 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isCurrent) {
      return setError('You can only submit EMI payment proof for the current month.');
    }

    if (isAlreadyPaid) {
      return setError('You have already paid your EMI for this month. Duplicate submissions are not allowed.');
    }

    if (isSubmissionPending) {
      return setError('You already have a pending EMI submission awaiting Admin review.');
    }

    if (!includeRegular && !includeLoanPrincipal && !includeLoanInterest) {
      return setError('Please select at least one component (Regular Fund, Loan Principal, or Loan Interest).');
    }

    if (calculatedTotal <= 0) {
      return setError('Total payment amount must be greater than ₹0.');
    }

    if (!selectedFile) {
      return setError('Please upload your payment successful screenshot proof image.');
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
      setSuccessMsg('EMI payment submission sent successfully! Admin will verify your payment proof.');
      setTimeout(() => {
        navigate('/member/contributions');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit EMI payment request.');
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Member Details & Month/Year Selection Banner */}
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
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-900 focus:border-brand-600 outline-hidden"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-900 focus:border-brand-600 outline-hidden"
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

      {/* RULE 1: PAST MONTH NOTICE */}
      {isPast && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-emerald-900">
            તમે આ મહિનાનું EMI અને લોન વ્યાજ પહેલેથી જ ચૂકવી દીધું છે!
          </h3>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            You have already paid this month's regular fund contribution, loan EMI, and interest. Past records are permanently settled and recorded in your ledger.
          </p>
        </div>
      )}

      {/* RULE 2: FUTURE MONTH NOTICE */}
      {isFuture && (
        <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-amber-900">
            તમે અત્યારે ભવિષ્યના મહિનાનું EMI સબમિટ કરી શકતા નથી, કૃપા કરીને રાહ જુઓ.
          </h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto">
            You cannot submit your EMI right now for future months ({monthNames[selectedMonth - 1]} {selectedYear}). Please wait until that month arrives.
          </p>
        </div>
      )}

      {/* RULE 4: CURRENT MONTH EVERYTHING ALREADY PAID */}
      {isCurrent && isEverythingPaid && (
        <div className="p-6 rounded-3xl bg-blue-50 border border-blue-200 text-blue-950 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-blue-900">
            તમે ચાલુ મહિનાનું ({monthNames[selectedMonth - 1]} {selectedYear}) સંપૂર્ણ ચુકવણું કરી દીધું છે!
          </h3>
          <p className="text-xs text-blue-700 max-w-md mx-auto">
            You have already successfully paid your monthly fund, loan principal, and interest for this month. All records are settled.
          </p>
        </div>
      )}

      {isCurrent && isSubmissionPending && (
        <div className="p-6 rounded-3xl bg-purple-50 border border-purple-200 text-purple-950 text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-purple-900">
            તમારી ચાલુ મહિનાની EMI અરજી એડમિન ચકાસણી હેઠળ છે.
          </h3>
          <p className="text-xs text-purple-700 max-w-md mx-auto">
            Your payment proof for {monthNames[selectedMonth - 1]} {selectedYear} is currently under Admin verification. Please wait for approval before submitting again.
          </p>
        </div>
      )}

      {/* RULE 3: CURRENT MONTH FORM (ENABLED IF CURRENT MONTH AND NOT EVERYTHING FULLY PAID) */}
      {isCurrent && !isEverythingPaid && !isSubmissionPending && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand-600" />
                Select Payment Components ({monthNames[selectedMonth - 1]} {selectedYear})
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                તમે અનુકૂળતા મુજબ ફક્ત ફંડ, ફક્ત વ્યાજ, કે બાકી મુદ્દલ પસંદ કરીને સબમિટ કરી શકો છો.
              </p>
            </div>
            {hasActiveLoan && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full shrink-0">
                Active Loan
              </span>
            )}
          </div>

          <div className="space-y-3">
            {/* Component 1: Regular Monthly Fund EMI */}
            <label className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              isRegularAlreadyPaid
                ? 'bg-emerald-50/40 border-emerald-200 cursor-not-allowed'
                : includeRegular 
                  ? 'bg-brand-50/60 border-brand-300 shadow-xs cursor-pointer' 
                  : 'bg-gray-50 border-gray-200 opacity-80 cursor-pointer'
            }`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  disabled={isRegularAlreadyPaid}
                  checked={isRegularAlreadyPaid ? true : includeRegular}
                  onChange={(e) => setIncludeRegular(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded-md focus:ring-brand-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">૧. નિયમિત માસિક ફંડ ફાળો (Regular Fund)</span>
                    {isRegularAlreadyPaid && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ✓ ચૂકવેલ (Paid)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">Standard monthly group fund contribution</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-brand-700">₹{regularAmount.toLocaleString('en-IN')}</span>
              </div>
            </label>

            {/* RULE 5: Component 2 & 3 appear ONLY when user has an active running loan */}
            {hasActiveLoan ? (
              <>
                {/* Component 2: Loan Principal EMI */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isLoanPrincipalAlreadyPaid
                    ? 'bg-emerald-50/40 border-emerald-200 cursor-not-allowed'
                    : includeLoanPrincipal 
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-xs cursor-pointer' 
                      : 'bg-gray-50 border-gray-200 opacity-80 cursor-pointer'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isLoanPrincipalAlreadyPaid}
                      checked={isLoanPrincipalAlreadyPaid ? true : includeLoanPrincipal}
                      onChange={(e) => setIncludeLoanPrincipal(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">૨. લોન મુદ્દલ હપ્તો (Loan Principal EMI)</span>
                        {isLoanPrincipalAlreadyPaid && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ ચૂકવેલ (Paid)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {isLoanPrincipalAlreadyPaid 
                          ? 'આ મહિનાનો મુદ્દલ હપ્તો ભરાઈ ગયેલ છે.' 
                          : 'Principal installment repayment towards active loan'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-700">
                      ₹{(remainingPrincipalDue || loanPrincipalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </label>

                {/* Component 3: Loan Interest Amount */}
                <label className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isLoanInterestAlreadyPaid
                    ? 'bg-emerald-50/40 border-emerald-200 cursor-not-allowed'
                    : includeLoanInterest 
                      ? 'bg-amber-50/60 border-amber-300 shadow-xs cursor-pointer' 
                      : 'bg-gray-50 border-gray-200 opacity-80 cursor-pointer'
                }`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isLoanInterestAlreadyPaid}
                      checked={isLoanInterestAlreadyPaid ? true : includeLoanInterest}
                      onChange={(e) => setIncludeLoanInterest(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">૩. લોન વ્યાજ રકમ (Loan Interest Amount)</span>
                        {isLoanInterestAlreadyPaid && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ ચૂકવેલ (Paid)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {isLoanInterestAlreadyPaid 
                          ? 'આ મહિનાનું વ્યાજ ભરાઈ ગયેલ છે.' 
                          : 'Monthly calculated reducing interest'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-amber-700">
                      ₹{(remainingInterestDue || loanInterestAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </label>
              </>
            ) : (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span>તમારી કોઈ સક્રિય લોન નથી, તેથી ફક્ત નિયમિત માસિક ફંડ જ લાગુ પડશે. (No active loan found)</span>
              </div>
            )}
          </div>

          {/* Auto-Calculated Total Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white flex justify-between items-center shadow-md">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-100">Total Payable Amount</span>
              <p className="text-xs text-brand-100 mt-0.5">
                Auto-calculated: {[
                  includeRegular ? `ફંડ ₹${regularAmount}` : null,
                  includeLoanPrincipal ? `મુદ્દલ ₹${loanPrincipalAmount}` : null,
                  includeLoanInterest ? `વ્યાજ ₹${loanInterestAmount}` : null
                ].filter(Boolean).join(' + ') || 'કોઈ વિકલ્પ પસંદ કરેલ નથી'}
              </p>
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
            disabled={submitting || calculatedTotal <= 0}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Uploading Proof & Submitting...' : `Submit Payment of ₹${calculatedTotal.toLocaleString('en-IN')} to Admin`}
          </button>
        </form>
      )}
    </div>
  );
};
