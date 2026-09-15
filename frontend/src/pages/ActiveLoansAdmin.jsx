import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatCurrency } from '../utils/formatters';
import { BadgeIndianRupee, ChevronRight } from 'lucide-react';

export const ActiveLoansAdmin = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/loans')
      .then(res => setLoans(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
          <BadgeIndianRupee className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Member Loans</h1>
          <p className="text-xs text-gray-500">Overview of all active and completed group loans.</p>
        </div>
      </div>

      <div className="space-y-3">
        {loans.map(loan => (
          <Link
            key={loan._id}
            to={`/member/loans/${loan._id}`}
            className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-brand-300 transition-all flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">{loan.memberId?.name}</h3>
                <StatusBadge status={loan.status} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Principal: <span className="font-bold text-gray-900">{formatCurrency(loan.principal)}</span> • Duration: {loan.months} Months
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
};
