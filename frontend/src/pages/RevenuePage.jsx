import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, PlusCircle } from 'lucide-react';

export const RevenuePage = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchRevenues = () => {
    setLoading(true);
    api.get('/revenue')
      .then(res => setRevenues(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRevenues();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/revenue', {
        amount: Number(amount) * 100, // in paise
        source,
        description
      });
      setShowModal(false);
      setAmount('');
      setSource('');
      setDescription('');
      fetchRevenues();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Other Group Revenue</h1>
            <p className="text-xs text-gray-500">Record external investment returns, interest, or fine revenues.</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Add Revenue
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
          {revenues.map(r => (
            <div key={r._id} className="p-4 flex justify-between items-center text-xs">
              <div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 mb-1">
                  {r.source}
                </span>
                <h4 className="font-bold text-gray-900">{r.description}</h4>
                <span className="text-[10px] text-gray-400">Date: {formatDate(r.date)} • Recorded by: {r.createdBy?.name}</span>
              </div>
              <div className="font-bold text-emerald-600 text-sm">
                +{formatCurrency(r.amount)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Group Revenue</h3>
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (in ₹)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="3000"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Investment Return, Fine, Other"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bank Fixed Deposit Interest Income"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl"
                >
                  Save Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
