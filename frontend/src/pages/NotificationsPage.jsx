import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDate } from '../utils/formatters';
import { 
  Bell, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Award
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => setNotifications(res.data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkSingleRead = async (id, isAlreadyRead) => {
    if (isAlreadyRead) return;
    await api.patch(`/notifications/${id}/read`);
    fetchNotifs();
  };

  const getNotifStyle = (type) => {
    switch (type) {
      case 'CONTRIBUTION_REMINDER':
      case 'EMI_DUE':
      case 'EMI_OVERDUE':
      case 'EMI_PAID':
        return {
          icon: Wallet,
          bg: 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
        };
      case 'LOAN_APPROVED':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
        };
      case 'LOAN_REJECTED':
        return {
          icon: XCircle,
          bg: 'bg-rose-500 text-white shadow-md shadow-rose-200'
        };
      case 'LOAN_COMPLETED':
        return {
          icon: Award,
          bg: 'bg-purple-600 text-white shadow-md shadow-purple-200'
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-blue-600 text-white shadow-md shadow-blue-200'
        };
    }
  };

  if (loading) return <div className="p-6 max-w-4xl mx-auto space-y-4"><LoadingSkeleton count={3} /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      {/* Top Bar: Back Button */}
      <div>
        <BackButton fallback={user?.role === 'ADMIN' ? '/admin' : '/member'} label="Back" />
      </div>

      {/* Minimal Notifications List: Only Logo Icon + Description + Date */}
      {notifications.length === 0 ? (
        <EmptyState 
          title="No Notifications" 
          message="You currently have no new notifications." 
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const style = getNotifStyle(n.type);
            const Icon = style.icon;

            return (
              <div
                key={n._id}
                onClick={() => handleMarkSingleRead(n._id, n.read)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                  n.read 
                    ? 'bg-white border-gray-100 opacity-80 hover:opacity-100 shadow-2xs' 
                    : 'bg-blue-50/50 border-blue-200 shadow-sm'
                }`}
              >
                {/* Bright Colored Icon Box */}
                <div className={`p-3 rounded-2xl shrink-0 ${style.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Notification Description & Date Only */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-gray-800 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] font-extrabold text-gray-400 whitespace-nowrap shrink-0">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
