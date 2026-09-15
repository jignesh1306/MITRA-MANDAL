import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/formatters';
import { Bell, CheckCheck } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => setNotifications(res.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/all/read');
    fetchNotifs();
  };

  if (loading) return <div className="p-6"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <BackButton fallback="/" label="Back" />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-500">Important alerts and updates for your account.</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No Notifications" message="You currently have no unread notifications." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition-all ${
                n.read ? 'bg-white border-gray-200 opacity-80' : 'bg-brand-50/40 border-brand-200 shadow-xs'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{n.title}</h3>
                <span className="text-[10px] text-gray-400 font-semibold">{formatDate(n.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
