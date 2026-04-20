import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Bell, Briefcase, CheckCircle, AlertTriangle, Info,
  MessageSquare, Clock, X, Check, Shield, User, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead, dismissNotification
} from '../../utils/api';
import { useNavigate } from 'react-router-dom';

// Notification type styles
const TYPE_CONFIG = {
  task_assigned: { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Task Assigned' },
  task_completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Task Verified' },
  urgent: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Urgent' },
  message: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Message' },
  announcement: { icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Announcement' },
  info: { icon: Info, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Info' },
  default: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Notification' },
};

// Determine source label from notification metadata
function getSourceTag(n) {
  if (n.senderRole === 'admin') return { label: 'Admin', color: 'bg-red-50 text-red-700 border border-red-200' };
  if (n.senderRole === 'special-employee') return { label: 'Supervisor', color: 'bg-purple-50 text-purple-700 border border-purple-200' };
  if (n.type === 'urgent') return { label: 'Admin', color: 'bg-red-50 text-red-700 border border-red-200' };
  if (n.type === 'task_assigned') return { label: 'Admin / Supervisor', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString();
}

function groupByDate(arr) {
  return arr.reduce((acc, n) => {
    const d = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});
}

export default function EmployeeNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !(n.isRead ?? n.read ?? false)).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true, read: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed'); }
  };

  const handleDismiss = async (id, e) => {
    e?.stopPropagation();
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Dismissed');
    } catch { toast.error('Failed to dismiss'); }
  };

  const handleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
    const n = notifications.find(x => x._id === id);
    if (n && !(n.isRead ?? n.read)) handleMarkRead(id);
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'admin', label: 'From Admin', isSource: true },
    { key: 'supervisor', label: 'From Supervisor', isSource: true },
    { key: 'task_assigned', label: 'Tasks' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'message', label: 'Messages' },
  ];

  const filterNotif = (n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !(n.isRead ?? n.read ?? false);
    if (activeFilter === 'admin') return n.senderRole === 'admin' || n.type === 'urgent' || n.type === 'task_assigned';
    if (activeFilter === 'supervisor') return n.senderRole === 'special-employee';
    return n.type === activeFilter;
  };

  const filtered = notifications.filter(filterNotif);
  const grouped = groupByDate(filtered);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-7 h-7 text-blue-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up! No unread notifications.'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Check className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
          {filters.map(f => {
            let count = 0;
            if (f.key === 'all') count = notifications.length;
            else if (f.key === 'unread') count = notifications.filter(n => !(n.isRead ?? n.read)).length;
            else if (f.key === 'admin') count = notifications.filter(n => n.senderRole === 'admin' || n.type === 'urgent' || n.type === 'task_assigned').length;
            else if (f.key === 'supervisor') count = notifications.filter(n => n.senderRole === 'special-employee').length;
            else count = notifications.filter(n => n.type === f.key).length;

            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 ${activeFilter === f.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {f.key === 'admin' && <Shield className="w-3.5 h-3.5" />}
                {f.key === 'supervisor' && <User className="w-3.5 h-3.5" />}
                {f.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No notifications in this category.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">{dateLabel}</p>
                <div className="space-y-3">
                  {items.map(n => {
                    const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.default;
                    const Icon = config.icon;
                    const isRead = n.isRead ?? n.read ?? false;
                    const isExpanded = expandedId === n._id;
                    const sourceTag = getSourceTag(n);

                    return (
                      <div
                        key={n._id}
                        className={`bg-white rounded-xl border transition-all shadow-sm ${!isRead ? 'border-blue-300 shadow-blue-50' : 'border-gray-200'
                          }`}
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
                          onClick={() => handleExpand(n._id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${config.bg} ${config.border} border`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                                  <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'} leading-snug truncate`}>
                                    {n.title}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => handleDismiss(n._id, e)}
                                  className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 flex-shrink-0"
                                  title="Dismiss"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                                  {config.label}
                                </span>
                                {sourceTag && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceTag.color}`}>
                                    {sourceTag.label}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-gray-400 text-xs">
                                  <Clock className="w-3 h-3" /> {formatDate(n.createdAt)}
                                </span>
                              </div>
                              {!isExpanded && (
                                <p className="text-gray-400 text-xs mt-2 line-clamp-1">{n.message || n.body}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <p className="text-gray-700 text-sm leading-relaxed pt-3">{n.message || n.body}</p>
                            <div className="flex flex-wrap gap-2 mt-4">
                              {n.type === 'task_assigned' && (
                                <button
                                  onClick={() => navigate('/employee/dashboard')}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                  View Task
                                </button>
                              )}
                              {n.type === 'urgent' && (
                                <button
                                  onClick={() => navigate('/employee/dashboard')}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                  Acknowledge
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDismiss(n._id, e)}
                                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
                              >
                                Dismiss
                              </button>
                            </div>
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
