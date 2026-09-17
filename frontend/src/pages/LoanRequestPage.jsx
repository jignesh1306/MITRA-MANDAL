import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { PlusCircle, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const LoanRequestPage = () => {
  const [amountInput, setAmountInput] = useState('50000');
  const [monthsInput, setMonthsInput] = useState('10');
  const [note, setNote] = useState('');

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const targetAmount = Number(amountInput) || 50000;
  const targetMonths = Number(monthsInput) || 10;

  useEffect(() => {
    api.post('/calculator/loan', { amount: targetAmount, months: targetMonths })
      .then(res => setPreview(res.data))
      .catch(() => {});
  }, [amountInput, monthsInput]);

  const handleAmountChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setAmountInput('');
      return;
    }
    const cleaned = valStr.replace(/^0+(?=\d)/, '');
    setAmountInput(cleaned);
  };

  const handleAmountBlur = () => {
    const num = parseInt(amountInput, 10);
    if (!amountInput || isNaN(num) || num < 1000) {
      setAmountInput('5000');
    } else if (num > 1000000) {
      setAmountInput('1000000');
    }
  };

  const handleMonthsChange = (e) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setMonthsInput('');
      return;
    }
    const cleaned = valStr.replace(/^0+(?=\d)/, '');
    setMonthsInput(cleaned);
  };

  const handleMonthsBlur = () => {
    const num = parseInt(monthsInput, 10);
    if (!monthsInput || isNaN(num) || num < 1) {
      setMonthsInput('1');
    } else if (num > 36) {
      setMonthsInput('36');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/loans/request', {
        amount: targetAmount * 100, // convert rupees to paise
        months: targetMonths,
        purpose: 'Loan Request',
        note
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <BackButton fallback="/member/loans" label="Back to My Loans" />
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apply for a Loan</h1>
          <p className="text-xs text-gray-500">New loan request form and schedule preview.</p>
        </div>
      </div>

      {success && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Loan Request Submitted Successfully!</h3>
              <p className="text-xs text-emerald-700">Your loan application of <strong>{formatCurrency(targetAmount)}</strong> for <strong>{targetMonths} months</strong> has been forwarded to Admin for approval.</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setNote('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Submit Another Request
            </button>
            <button
              type="button"
              onClick={() => navigate('/member/loans')}
              className="px-4 py-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Go to My Loans Dashboard
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Loan Amount (in ₹): {formatCurrency(targetAmount, true)}
              </label>
              <input
                type="number"
                min="5000"
                max="1000000"
                step="1000"
                required
                value={amountInput}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                placeholder="50000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-brand-600 outline-hidden transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Duration (Months): {targetMonths} months
              </label>
              <input
                type="number"
                min="1"
                max="36"
                required
                value={monthsInput}
                onChange={handleMonthsChange}
                onBlur={handleMonthsBlur}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-brand-600 outline-hidden transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Note (Optional)</label>
            <textarea
              rows="2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional notes for admin review..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-600 outline-hidden transition-all"
            />
          </div>

          {/* Calculation Preview */}
          {preview && (
            <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100 space-y-2">
              <h4 className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-brand-600" />
                Calculated Preview
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Interest Rate:</span> <span className="font-bold">{preview.interestRate}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Interest:</span> <span className="font-bold text-amber-600">{formatCurrency(preview.totalInterest)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Repayment:</span> <span className="font-bold text-brand-700">{formatCurrency(preview.totalRepayment)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Average EMI:</span> <span className="font-bold text-emerald-600">{formatCurrency(preview.averageEMI)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Submitting Request...' : 'Submit Loan Request'}
          </button>
        </form>
      )}
    </div>
  );
};
