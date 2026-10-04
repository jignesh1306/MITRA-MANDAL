import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, UserMinus } from 'lucide-react';
import api from '../services/api';

export const RemoveMemberModal = ({ isOpen, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteOption, setDeleteOption] = useState('data'); // 'data' or 'only'
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedMember(null);
      api.get('/members')
        .then(res => setMembers(res.data))
        .catch(err => alert('Failed to fetch members: ' + err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!selectedMember) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/members/${selectedMember._id}?deleteData=${deleteOption === 'data'}`);
      setMembers(members.filter(m => m._id !== selectedMember._id));
      setSelectedMember(null);
      alert('Member successfully removed.');
    } catch (err) {
      alert('Error removing member: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-rose-500" />
            Remove Member
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {selectedMember ? (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Remove {selectedMember.name}?</h3>
                  <p className="text-xs font-semibold text-rose-700 mt-1">This action cannot be undone.</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${deleteOption === 'data' ? 'bg-rose-50 border-rose-500 shadow-sm' : 'bg-white hover:border-gray-300 border-gray-200'}`}>
                  <input
                    type="radio"
                    checked={deleteOption === 'data'}
                    onChange={() => setDeleteOption('data')}
                    className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-sm font-black text-gray-900">Delete Member & All Financial Data</div>
                    <div className="text-xs font-semibold text-gray-500 mt-0.5">Removes the user and completely erases their loans, contributions, and transactions. Group totals will be updated.</div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${deleteOption === 'only' ? 'bg-rose-50 border-rose-500 shadow-sm' : 'bg-white hover:border-gray-300 border-gray-200'}`}>
                  <input
                    type="radio"
                    checked={deleteOption === 'only'}
                    onChange={() => setDeleteOption('only')}
                    className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-sm font-black text-gray-900">Just Remove Member (Keep Data)</div>
                    <div className="text-xs font-semibold text-gray-500 mt-0.5">Removes the user account, but keeps their financial entries so the total group fund balance remains exactly the same.</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Remove'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-sm font-bold text-gray-500 p-4">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="text-center text-sm font-bold text-gray-500 p-4">No members found.</div>
              ) : (
                members.map(m => (
                  <div key={m._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="text-sm font-black text-gray-900">{m.name}</div>
                      <div className="text-[11px] font-semibold text-gray-500">{m.phone}</div>
                    </div>
                    <button
                      onClick={() => setSelectedMember(m)}
                      className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
