import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { Users, Search, ChevronRight, BadgeIndianRupee } from 'lucide-react';

export const MemberDirectoryPage = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/members?search=${search}`;
    api.get(url)
      .then(res => setMembers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  const activeMembers = members.filter(m => m.status === 'ACTIVE');

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-3.5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Members</h1>
            <p className="text-xs text-gray-500">View all group members and their active loan status</p>
          </div>
        </div>
      </div>

      {/* Search Bar Only */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search member by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-brand-600 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Member Cards Grid */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : activeMembers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-200 text-gray-500 text-xs font-semibold">
          No members found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMembers.map((m) => {
            const hasLoan = m.loanSummary?.hasActiveLoan;
            return (
              <Link
                key={m._id}
                to={`/member/directory/${m._id}`}
                className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Profile Picture / Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & Loan Status Only */}
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                      {m.name}
                    </h3>

                    <div>
                      {hasLoan ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <BadgeIndianRupee className="w-3 h-3" />
                          Active Loan: {formatCurrency(m.loanSummary.remainingPrincipal)} Remaining
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          No Active Loan
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-brand-50 text-gray-400 group-hover:text-brand-600 flex items-center justify-center shrink-0 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
