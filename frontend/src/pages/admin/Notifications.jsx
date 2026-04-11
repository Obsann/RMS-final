import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Bell, CheckCircle, AlertTriangle, Info, MessageSquare, Clock, X, Check, Send, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getNotifications, markAllNotificationsRead, markNotificationRead, dismissNotification, sendAnnouncement } from '../../utils/api';

const TYPES = {
  system: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'System' },
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Alert' },
  approval: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Approval' },
  message: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Message' },
  announcement: { icon: Send, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Announcement' }
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState({ target: 'all', subject: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  const handleMarkAsRead = async (id, currentReadStatus) => {
    if (currentReadStatus) return; // already read
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification dismissed');
    } catch (error) {
      toast.error('Failed to dismiss notification');
    }
  };

  const toggle = (id, readStatus) => {
    setExpandedId(prev => prev === id ? null : id);
    if (!readStatus) {
      handleMarkAsRead(id, readStatus);
    }
  };

  const filtered = activeFilter === 'all'
    ? notifications
    : activeFilter === 'unread'
      ? notifications.filter(n => !n.readStatus)
      : notifications.filter(n => n.type === activeFilter);

  const handleSendBroadcast = async () => {
    if (!broadcastMsg.subject || !broadcastMsg.body) { toast.error('Please fill in all fields'); return; }

    setSubmitting(true);
    try {
      const payload = {
        title: broadcastMsg.subject,
        message: broadcastMsg.body
      };

      if (broadcastMsg.target !== 'all') {
        payload.targetRole = broadcastMsg.target.replace(/s$/, ''); // maps 'residents' -> 'resident'
      }

      await sendAnnouncement(payload);
      toast.success(`Broadcast sent to ${broadcastMsg.target === 'all' ? 'everyone' : broadcastMsg.target}!`);
      setShowBroadcast(false);
      setBroadcastMsg({ target: 'all', subject: '', body: '' });
      fetchNotifications();
    } catch (error) {
      toast.error(error.message || 'Failed to send broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'alert', label: 'Alerts' },
    { key: 'approval', label: 'Approvals' },
    { key: 'announcement', label: 'Announcements' },
    { key: 'system', label: 'System' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <Bell className="w-7 h-7 text-blue-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-sm">{unreadCount}</span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button disabled={submitting} onClick={handleMarkAllAsRead} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Check className="w-4 h-4" /> Mark all read
              </button>
            )}
            <button onClick={() => setShowBroadcast(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Send className="w-4 h-4" /> Broadcast
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
          {filters.map(f => {
            const count = f.key === 'all' ? notifications.length
              : f.key === 'unread' ? notifications.filter(n => !n.readStatus).length
                : notifications.filter(n => n.type === f.key).length;

            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${activeFilter === f.key ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                {f.label}
                {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeFilter === f.key ? 'bg-white text-blue-600' : 'bg-gray-100'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(notif => {
              const cfg = TYPES[notif.type] || TYPES.system;
              const Icon = cfg.icon;
              const isExpanded = expandedId === notif._id;
              return (
                <div key={notif._id} className={`bg-white rounded-xl border transition-all overflow-hidden ${!notif.readStatus ? 'border-blue-300 shadow-md bg-blue-50/10' : 'border-gray-200 shadow-sm'}`}>
                  <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle(notif._id, notif.readStatus)}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg} ${cfg.border} border`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {!notif.readStatus && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                            <p className={`font-medium ${notif.readStatus ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDismiss(notif._id); }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 flex-shrink-0 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <span className="flex items-center gap-1 text-gray-500 text-xs"><Clock className="w-3.5 h-3.5" /> {new Date(notif.createdAt).toLocaleString()}</span>
                        </div>
                        {!isExpanded ? (
                          <p className="text-gray-500 mt-2 line-clamp-1 text-sm">{notif.message}</p>
                        ) : (
                          <p className="text-gray-700 mt-2 leading-relaxed text-sm whitespace-pre-wrap flex-1">{notif.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 flex gap-3 border-t border-gray-100 pt-3 bg-gray-50/50">
                      {notif.relatedId && notif.relatedType && (
                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">View Details</button>
                      )}
                      <button onClick={() => handleDismiss(notif._id)} className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">Dismiss</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900"><Send className="w-6 h-6 text-blue-600" /> Broadcast Message</h2>
              <button onClick={() => setShowBroadcast(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
              Broadcasts are sent directly to the notification inbox of matching users. Wait a few moments for delivery.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Audience *</label>
              <select value={broadcastMsg.target} onChange={e => setBroadcastMsg({ ...broadcastMsg, target: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">Everyone (All Approved Users)</option>
                <option value="residents">Residents Only</option>
                <option value="employees">Employees Only</option>
                <option value="special-employees">Special Employees Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
              <input value={broadcastMsg.subject} onChange={e => setBroadcastMsg({ ...broadcastMsg, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g. Scheduled Water Maintenance" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Content *</label>
              <textarea value={broadcastMsg.body} onChange={e => setBroadcastMsg({ ...broadcastMsg, body: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={5} placeholder="Type your detailed message here..." />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button disabled={submitting} onClick={handleSendBroadcast} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Broadcast'}
              </button>
              <button disabled={submitting} onClick={() => setShowBroadcast(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
