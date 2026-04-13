import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Bell, Briefcase, CheckCircle, AlertTriangle, Info, MessageSquare,
  Clock, X, Check, IdCard, Users, Loader2, Zap, Star, ChevronDown,
  ChevronUp, Flame, ArrowRight, Shield, Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead, dismissNotification } from '../../utils/api';

const TYPE_CFG = {
  task_assigned: { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Task Assigned', gradient: 'from-blue-500 to-indigo-600' },
  task_completed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', label: 'Task Completed', gradient: 'from-emerald-500 to-teal-600' },
  urgent: { icon: Flame, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', label: 'Urgent', gradient: 'from-red-500 to-rose-600' },
  message: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', label: 'Admin Message', gradient: 'from-purple-500 to-violet-600' },
  id_request: { icon: IdCard, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700', label: 'ID Request', gradient: 'from-indigo-500 to-blue-600' },
  announcement: { icon: Volume2, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Announcement', gradient: 'from-blue-600 to-cyan-600' },
  info: { icon: Info, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Info', gradient: 'from-amber-500 to-orange-500' },
};

const typeFilters = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'unread', label: 'Unread', icon: Star },
  { key: 'urgent', label: 'Urgent', icon: Flame },
  { key: 'id_request', label: 'ID Requests', icon: IdCard },
  { key: 'task_assigned', label: 'Tasks', icon: Briefcase },
  { key: 'task_completed', label: 'Completed', icon: CheckCircle },
  { key: 'message', label: 'From Admin', icon: MessageSquare },
];

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
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

  const handleToggle = async (notif) => {
    const isRead = notif.isRead ?? notif.read ?? false;
    setExpandedId(prev => prev === notif._id ? null : notif._id);
    if (!isRead) {
      try {
        await markNotificationRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true, read: true } : n));
      } catch { /* silent */ }
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
    finally { setMarkingAll(false); }
  };

  const handleDismiss = async (id, e) => {
    e?.stopPropagation();
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification dismissed');
    } catch { toast.error('Failed to dismiss notification'); }
  };

  const filtered = notifications.filter(n => {
    const isRead = n.isRead ?? n.read ?? false;
    const type = n.type || n.notificationType || '';
    if (activeFilter === 'unread') return !isRead;
    if (activeFilter === 'all') return true;
    return type === activeFilter;
  });

  const getCounts = (key) => {
    if (key === 'all') return notifications.length;
    if (key === 'unread') return notifications.filter(n => !n.isRead && !n.read).length;
    return notifications.filter(n => (n.type || n.notificationType || '') === key).length;
  };

  const groups = filtered.reduce((acc, n) => {
    const d = new Date(n.createdAt);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const label = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString();
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden p-6"
          style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                {unreadCount > 0 && (
                  <span className="w-6 h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-white">Notifications</h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} awaiting` : 'All caught up — no unread notifications!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-sm font-semibold transition-all backdrop-blur-sm disabled:opacity-60">
                {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map(f => {
              const count = getCounts(f.key);
              const Icon = f.icon;
              return (
                <button key={f.key} onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeFilter === f.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {f.label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-indigo-300" />
            </div>
            <p className="text-gray-600 font-semibold">No notifications here</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeFilter === 'unread' ? 'You\'re fully caught up!' : 'Nothing in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{dateLabel}</p>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400 font-semibold">{items.length} item{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3">
                  {items.map(notif => {
                    const type = notif.type || notif.notificationType || 'info';
                    const cfg = TYPE_CFG[type] || TYPE_CFG.info;
                    const Icon = cfg.icon;
                    const isRead = notif.isRead ?? notif.read ?? false;
                    const isExpanded = expandedId === notif._id;

                    return (
                      <div key={notif._id}
                        className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
                          !isRead
                            ? 'border-indigo-200 shadow-md shadow-indigo-50'
                            : 'border-gray-100 shadow-sm'
                        }`}>
                        {/* Unread top bar */}
                        {!isRead && <div className={`h-1 bg-gradient-to-r ${cfg.gradient}`} />}

                        <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleToggle(notif)}>
                          <div className="flex items-start gap-4">
                            <div className={`w-11 h-11 bg-gradient-to-br ${cfg.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {!isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 animate-pulse" />}
                                  <p className={`text-sm leading-snug truncate ${!isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                    {notif.title || notif.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isExpanded
                                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                                  }
                                  <button onClick={(e) => handleDismiss(notif._id, e)}
                                    className="p-1 hover:bg-gray-200 rounded-lg text-gray-400 transition-colors">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${cfg.badge}`}>{cfg.label}</span>
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                                {isRead && <span className="text-xs text-gray-300 font-semibold">· Read</span>}
                              </div>
                              {!isExpanded && notif.body && (
                                <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{notif.body}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className={`mx-4 mb-4 p-4 ${cfg.bg} border ${cfg.border} rounded-xl`}>
                            {notif.body && <p className="text-sm text-gray-800 leading-relaxed mb-4">{notif.body}</p>}
                            <div className="flex gap-2 flex-wrap">
                              {type === 'task_assigned' && (
                                <button onClick={() => navigate('/special-employee/requests')}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                                  <ArrowRight className="w-3.5 h-3.5" /> View Task
                                </button>
                              )}
                              {type === 'id_request' && (
                                <button onClick={() => navigate('/special-employee/digital-id')}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
                                  <IdCard className="w-3.5 h-3.5" /> Manage ID
                                </button>
                              )}
                              {type === 'urgent' && (
                                <button onClick={() => navigate('/special-employee/requests')}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
                                  <Zap className="w-3.5 h-3.5" /> Take Action
                                </button>
                              )}
                              {type === 'task_completed' && (
                                <button onClick={() => navigate('/special-employee/requests')}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700">
                                  <CheckCircle className="w-3.5 h-3.5" /> Verify & Close
                                </button>
                              )}
                              <button onClick={(e) => handleDismiss(notif._id, e)}
                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100">
                                <X className="w-3.5 h-3.5" /> Dismiss
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
