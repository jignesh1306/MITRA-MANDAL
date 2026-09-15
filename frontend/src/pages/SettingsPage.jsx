import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Settings, Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyContribution: 200000,
    defaultInterestRate: 1.0,
    interestType: 'REDUCING',
    maxActiveLoansPerMember: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(res => setFormData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    try {
      await api.patch('/settings', formData);
      setSuccess('Settings updated successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Group Settings</h1>
          <p className="text-xs text-gray-500">Configure contribution amounts and interest calculation rules.</p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Contribution Amount (in ₹)</label>
          <input
            type="number"
            required
            value={formData.monthlyContribution / 100}
            onChange={(e) => setFormData({ ...formData, monthlyContribution: Number(e.target.value) * 100 })}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Default Interest Rate</label>
          <div className="flex gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setFormData({ ...formData, defaultInterestRate: rate })}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  formData.defaultInterestRate === rate ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Interest Calculation Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, interestType: 'REDUCING' })}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                formData.interestType === 'REDUCING' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              Monthly Reducing Balance
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, interestType: 'FLAT' })}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                formData.interestType === 'FLAT' ? 'bg-brand-600 text-white border-brand-600' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              Flat Rate
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};
