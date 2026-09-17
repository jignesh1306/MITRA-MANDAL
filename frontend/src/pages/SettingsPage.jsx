import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  Save, 
  CheckCircle2, 
  Building2, 
  Wallet, 
  BadgeIndianRupee, 
  LogOut 
} from 'lucide-react';

export const SettingsPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
      setSuccess('Group settings updated successfully.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="p-4 max-w-4xl mx-auto"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-4 pb-4">
      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* UNIFIED CONTAINER FOR ALL SETTINGS MODULES */}
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-md space-y-6">
        
        {/* MODULE 1: Group Identity & Profile Settings */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/60 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
            <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Group Identity & Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Group Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-gray-900 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Group Description / Note</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mitra-Mandal Savings & Credit Association"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-gray-900 focus:border-amber-500 outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* MODULE 2: Monthly Regular Contribution Settings */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200/60 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/60">
            <div className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider">Monthly Contribution Parameters</h3>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">Default Regular Member EMI Amount (in ₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-extrabold text-emerald-600">₹</span>
              <input
                type="number"
                required
                min="100"
                step="100"
                value={formData.monthlyContribution / 100}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: Number(e.target.value) * 100 })}
                className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-gray-900 focus:border-emerald-500 outline-hidden transition-all shadow-2xs"
              />
            </div>
            <span className="text-[10px] font-medium text-emerald-700 mt-1.5 block">This amount is automatically billed to every active group member on the 1st of each month.</span>
          </div>
        </div>

        {/* MODULE 3: Community Loan Rules & Interest Calculations */}
        <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-200/60 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-violet-200/60">
            <div className="p-1.5 bg-violet-500 text-white rounded-lg shadow-xs">
              <BadgeIndianRupee className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold text-violet-900 uppercase tracking-wider">Loan Interest & Rules Configuration</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Default Monthly Interest Rate (%)</label>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1.0, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultInterestRate: rate })}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      formData.defaultInterestRate === rate 
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                        : 'bg-white border-violet-200 text-violet-900 hover:bg-violet-50'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Interest Calculation Formula</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, interestType: 'REDUCING' })}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                    formData.interestType === 'REDUCING' 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                      : 'bg-white border-violet-200 text-violet-900 hover:bg-violet-50'
                  }`}
                >
                  <div className="font-black">Monthly Reducing Balance</div>
                  <div className={`text-[10px] mt-0.5 ${formData.interestType === 'REDUCING' ? 'text-violet-100' : 'text-gray-500'}`}>
                    Interest charged on remaining principal only.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, interestType: 'FLAT' })}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                    formData.interestType === 'FLAT' 
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm' 
                      : 'bg-white border-violet-200 text-violet-900 hover:bg-violet-50'
                  }`}
                >
                  <div className="font-black">Flat Interest Rate</div>
                  <div className={`text-[10px] mt-0.5 ${formData.interestType === 'FLAT' ? 'text-violet-100' : 'text-gray-500'}`}>
                    Fixed interest calculated on initial principal.
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 text-xs font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      {/* ADMIN LOGOUT SECTION */}
      <div className="bg-rose-500/10 p-4 rounded-3xl border border-rose-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Log Out Admin Account</h4>
          <p className="text-[11px] font-semibold text-rose-700">End your current session safely and return to the login screen.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          Log Out Admin
        </button>
      </div>
    </div>
  );
};
