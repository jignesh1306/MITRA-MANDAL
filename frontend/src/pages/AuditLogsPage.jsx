import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/formatters';
import { ShieldAlert } from 'lucide-react';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit-logs')
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><LoadingSkeleton count={4} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-xs text-gray-500">System security records and administrative audit trail.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
        {logs.map(log => (
          <div key={log._id} className="p-4 text-xs flex justify-between items-start">
            <div>
              <span className="font-bold text-gray-900">{log.action}</span>
              <p className="text-gray-500 text-[11px] mt-0.5">
                Entity: {log.entityType} ({log.entityId}) • Performed by: {log.userId?.name} ({log.userId?.role})
              </p>
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">{formatDate(log.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
