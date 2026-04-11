import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Bell, Briefcase, CheckCircle, AlertTriangle, Info, MessageSquare,
  Clock, X, Check, IdCard, Users, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead, dismissNotification } from '../../utils/api';

const TYPE_CFG = {
  task_assigned: { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Task Assigned' },
  task_completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Task Completed' },
  urgent: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Urgent' },
  message: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'From Admin' },
  id_request: { icon: IdCard, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'ID Request' },
  announcement: { icon: Users, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Announcement' },
  info: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Info' },
};

export default function SpecialEmployeeNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || data || []);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  const handleToggle = async (notif) => {
    const isRead = notif.isRead ?? notif.read ?? false;
    setExpandedId(prev => prev === notif._id ? null : notif._id);
    // Mark as read when expanding, only if currently unread
    if (!isRead) {
      try {
        await markNotificationRead(notif._id);
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, isRead: true, read: true } : n)
        );
      } catch (e) { /* silent */ }
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDismiss = async (id, e) => {
    e?.stopPropagation();
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification dismissed');
    } catch (e) {
      toast.error('Failed to dismiss notification');
    }
  };

  const handleAction = (notif) => {
    const type = notif.type || notif.notificationType || '';
    if (type === 'id_request') navigate('/special-employee/digital-id');
    else if (type === 'urgent') navigate('/special-employee/requests');
    else if (type === 'task_completed' || type === 'task_assigned') navigate('/special-employee/requests');
    else if (type === 'message' || type === 'announcement') navigate('/special-employee/notifications');
  };

  const typeFilters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'id_request', label: 'ID Requests' },
    { key: 'task_assigned', label: 'Tasks' },
    { key: 'task_completed', label: 'Completed' },
    { key: 'message', label: 'From Admin' },
  ];

  const filtered = notifications.filter(n => {
    const isRead = n.isRead ?? n.read ?? false;
    const type = n.type || n.notificationType || '';
    if (activeFilter === 'unread') return !isRead;
    if (activeFilter === 'all') return true;
    return type === activeFilter;
  });

  // Group by date
  const groups = filtered.reduce((acc, n) => {
    const d = new Date(n.createdAt);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let label = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString();
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3">
              <Bell className="w-7 h-7 text-blue-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-sm font-medium">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
          {typeFilters.map(f => {
            const isRead = (n) => n.isRead ?? n.read ?? false;
            const type = (n) => n.type || n.notificationType || '';
            const count = f.key === 'all'
              ? notifications.length
              : f.key === 'unread'
                ? notifications.filter(n => !isRead(n)).length
                : notifications.filter(n => type(n) === f.key).length;
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${activeFilter === f.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {f.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {activeFilter === 'unread' ? 'All caught up! No unread notifications.' : 'No notifications in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-sm text-gray-500 font-medium mb-3 px-1">{dateLabel}</p>
                <div className="space-y-3">
                  {items.map(notif => {
                    const type = notif.type || notif.notificationType || 'info';
                    const cfg = TYPE_CFG[type] || TYPE_CFG.info;
                    const Icon = cfg.icon;
                    const isRead = notif.isRead ?? notif.read ?? false;
                    const isExpanded = expandedId === notif._id;
                    return (
                      <div key={notif._id}
                        className={`bg-white rounded-xl border transition-all overflow-hidden ${!isRead ? 'border-blue-300 shadow-md' : 'border-gray-200 shadow-sm'}`}>
                        <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleToggle(notif)}>
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg} ${cfg.border} border`}>
                              <Icon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                                  <p className={`text-sm leading-snug ${isRead ? 'text-gray-700' : 'text-gray-900 font-medium'} truncate`}>
                                    {notif.title || notif.message}
                                  </p>
                                </div>
                                <button onClick={(e) => handleDismiss(notif._id, e)}
                                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 flex-shrink-0">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Clock className="w-3.5 h-3.5" />
                                  {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              {!isExpanded && notif.body && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-1">{notif.body}</p>
                              )}
                              {isExpanded && notif.body && (
                                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{notif.body}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons when expanded */}
                        {isExpanded && (
                          <div className="px-4 pb-4 flex gap-3 flex-wrap border-t border-gray-100 pt-3">
                            {type === 'task_assigned' && (
                              <button onClick={() => navigate('/special-employee/requests')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                                View Task
                              </button>
                            )}
                            {type === 'id_request' && (
                              <button onClick={() => navigate('/special-employee/digital-id')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                Manage ID Request
                              </button>
                            )}
                            {type === 'urgent' && (
                              <button onClick={() => navigate('/special-employee/requests')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
                                Take Action
                              </button>
                            )}
                            {type === 'task_completed' && (
                              <button onClick={() => navigate('/special-employee/requests')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                                Verify & Close
                              </button>
                            )}
                            <button onClick={(e) => handleDismiss(notif._id, e)}
                              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm">
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
