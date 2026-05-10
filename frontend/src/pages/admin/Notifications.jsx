import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  Bell, CheckCircle, AlertTriangle, Info, MessageSquare,
  Clock, X, Check, Send, Loader2, ArrowUpRight, ShieldAlert,
  ChevronLeft, ChevronRight, User as UserIcon, Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotifications, markAllNotificationsRead, markNotificationRead,
  dismissNotification, sendAnnouncement, sendDirectMessage,
  getRequests, getUsers
} from '../../utils/api';

const TYPES = {
  system:     { icon: Info,          color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'System' },
  alert:      { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Alert' },
  approval:   { icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Approval' },
  message:    { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Message' },
  announcement:{ icon: Send,         color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Sent' },
  escalation: { icon: ArrowUpRight,  color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Escalation' },
};

const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const PRIORITY_COLOR = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700 font-semibold',
};

const PAGE_SIZE = 10;

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState('all');
  const [expandedId, setExpandedId]       = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);

  /* ---------- Broadcast state ---------- */
  const [showBroadcast, setShowBroadcast]   = useState(false);
  const [broadcastMode, setBroadcastMode]   = useState('group'); // 'group' | 'individual'
  const [broadcastMsg, setBroadcastMsg]     = useState({ target: 'all', subject: '', body: '' });
  const [userSearch, setUserSearch]         = useState('');
  const [userResults, setUserResults]       = useState([]);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => { fetchData(); }, []);

  /* ---------- Fetch ---------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [notifData, escalatedData] = await Promise.all([
        getNotifications(),
        getRequests('limit=50'),
      ]);

      // Security-related notifications only
      const rawNotifs = notifData.notifications || [];
      const staffNotifs = rawNotifs.filter(n => {
        const content = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
        return content.includes('security') || content.includes('suspicious') ||
               content.includes('emergency') || content.includes('break-in') ||
               n.type === 'alert';
      });

      // ALL escalated requests — not just security/high
      const allRequests = escalatedData.requests || [];
      const escalationNotifs = allRequests
        .filter(r => r.isEscalated && r.status === 'pending')
        .map(r => ({
          _id: `esc-${r._id}`,
          type: 'escalation',
          priority: r.priority,
          title: `Escalation: ${r.subject || r.category || 'Request'}`,
          message: `${r.escalatedBy?.username || 'Staff'} escalated a request from resident ${r.resident?.username || '—'}. ${r.escalationNote || ''}`,
          createdAt: r.escalatedAt || r.createdAt,
          readStatus: false,
          isVirtual: true,
        }));

      // Sort: unread first, then newest
      const merged = [...escalationNotifs, ...staffNotifs].sort(
        (a, b) => (a.readStatus - b.readStatus) || (new Date(b.createdAt) - new Date(a.createdAt))
      );
      setNotifications(merged);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Handlers ---------- */
  const unreadCount = notifications.filter(n => !n.readStatus).length;

  const handleMarkAsRead = async (id, alreadyRead) => {
    if (alreadyRead || id.startsWith('esc-')) return;
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
    } catch { /* silent */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleDismiss = async (id) => {
    if (id.startsWith('esc-')) {
      setNotifications(prev => prev.filter(n => n._id !== id));
      return;
    }
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { toast.error('Failed to dismiss'); }
  };

  const toggle = (id, readStatus) => {
    setExpandedId(prev => prev === id ? null : id);
    handleMarkAsRead(id, readStatus);
  };

  /* ---------- User search (individual mode) ---------- */
  const searchUsers = async (q) => {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    try {
      setSearchLoading(true);
      const data = await getUsers(`search=${encodeURIComponent(q)}&limit=8`);
      setUserResults(data.users || []);
    } catch { /* silent */ } finally { setSearchLoading(false); }
  };

  /* ---------- Send broadcast ---------- */
  const handleSend = async () => {
    if (!broadcastMsg.subject || !broadcastMsg.body) {
      toast.error('Please fill in subject and message'); return;
    }
    setSubmitting(true);
    try {
      if (broadcastMode === 'individual') {
        if (!selectedUser) { toast.error('Select a recipient first'); setSubmitting(false); return; }
        await sendDirectMessage(selectedUser._id, { title: broadcastMsg.subject, message: broadcastMsg.body });
        toast.success(`Message sent to ${selectedUser.username}`);
      } else {
        const payload = { title: broadcastMsg.subject, message: broadcastMsg.body };
        if (broadcastMsg.target !== 'all') {
          // maps 'residents' -> 'resident', 'employees' -> 'employee', etc.
          payload.targetRole = broadcastMsg.target.replace(/-?s$/, '');
        }
        await sendAnnouncement(payload);
        toast.success(`Broadcast sent to ${broadcastMsg.target === 'all' ? 'everyone' : broadcastMsg.target}`);
      }
      setShowBroadcast(false);
      resetBroadcast();
      fetchData();
    } catch (e) {
      toast.error(e.message || 'Send failed');
    } finally { setSubmitting(false); }
  };

  const resetBroadcast = () => {
    setBroadcastMode('group');
    setBroadcastMsg({ target: 'all', subject: '', body: '' });
    setUserSearch(''); setUserResults([]); setSelectedUser(null);
  };

  /* ---------- Filtering + pagination ---------- */
  const filtered = activeFilter === 'all'     ? notifications
    : activeFilter === 'unread'               ? notifications.filter(n => !n.readStatus)
    : notifications.filter(n => n.type === activeFilter);

  const totalPages     = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated      = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [activeFilter, notifications.length]);

  const goPage = (p) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filters = [
    { key: 'all',       label: 'All' },
    { key: 'unread',    label: 'Unread' },
    { key: 'escalation',label: 'Escalations' },
    { key: 'alert',     label: 'Alerts' },
  ];

  /* ====== RENDER ====== */
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <ShieldAlert className="w-7 h-7 text-red-600" />
              Security &amp; Escalation Alerts
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-sm">{unreadCount}</span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Staff-reported security incidents and all escalated resident requests.
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Check className="w-4 h-4" /> Mark all read
              </button>
            )}
            <button onClick={() => setShowBroadcast(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <Send className="w-4 h-4" /> Broadcast
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
          {filters.map(f => {
            const count = f.key === 'all'    ? notifications.length
              : f.key === 'unread'           ? notifications.filter(n => !n.readStatus).length
              : notifications.filter(n => n.type === f.key).length;
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm
                  ${activeFilter === f.key ? 'bg-blue-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                {f.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                    ${activeFilter === f.key ? 'bg-white text-blue-600' : 'bg-gray-100'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p>Loading alerts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No alerts at this time.</p>
            <p className="text-gray-400 text-sm mt-1">Security incidents and escalated requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map(notif => {
              const cfg = TYPES[notif.type] || TYPES.system;
              const Icon = cfg.icon;
              const isExpanded = expandedId === notif._id;
              return (
                <div key={notif._id}
                  className={`bg-white rounded-xl border transition-all overflow-hidden
                    ${!notif.readStatus ? 'border-blue-300 shadow-md' : 'border-gray-200 shadow-sm'}`}>
                  <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle(notif._id, notif.readStatus)}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg} ${cfg.border} border`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!notif.readStatus && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                            <p className={`font-medium text-sm ${notif.readStatus ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notif.title}
                            </p>
                            {notif.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLOR[notif.priority] || PRIORITY_COLOR.medium}`}>
                                {PRIORITY_LABEL[notif.priority]}
                              </span>
                            )}
                          </div>
                          <button onClick={e => { e.stopPropagation(); handleDismiss(notif._id); }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-gray-500 mt-2 text-sm ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-1'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 flex gap-3 border-t border-gray-100 pt-3 bg-gray-50/50">
                      <button onClick={() => handleDismiss(notif._id)}
                        className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors">
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-5 mt-4">
                <span className="text-sm text-gray-500">
                  {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} alerts
                </span>
                <div className="flex gap-2">
                  <button onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => goPage(currentPage + 1)} disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== BROADCAST MODAL ===== */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            {/* Title */}
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Send className="w-5 h-5 text-blue-600" /> Send Message
              </h2>
              <button onClick={() => { setShowBroadcast(false); resetBroadcast(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button onClick={() => { setBroadcastMode('group'); setSelectedUser(null); setUserSearch(''); setUserResults([]); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${broadcastMode === 'group' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                <Users className="w-4 h-4" /> Group Broadcast
              </button>
              <button onClick={() => { setBroadcastMode('individual'); setBroadcastMsg(p => ({ ...p, target: 'all' })); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${broadcastMode === 'individual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                <UserIcon className="w-4 h-4" /> Direct Message
              </button>
            </div>

            {/* Conditional: group target OR user search */}
            {broadcastMode === 'group' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Send to *</label>
                <select value={broadcastMsg.target}
                  onChange={e => setBroadcastMsg(p => ({ ...p, target: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Everyone (All Approved Users)</option>
                  <option value="residents">Residents Only</option>
                  <option value="employees">Employees Only</option>
                </select>
              </div>
            ) : (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Recipient *</label>
                <input
                  value={selectedUser ? selectedUser.username : userSearch}
                  onChange={e => { setSelectedUser(null); searchUsers(e.target.value); }}
                  placeholder="Type a name or email..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-9 w-4 h-4 animate-spin text-gray-400" />
                )}
                {userResults.length > 0 && !selectedUser && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {userResults.map(u => (
                      <button key={u._id} onClick={() => { setSelectedUser(u); setUserSearch(''); setUserResults([]); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-900 text-sm font-medium">{u.username}</p>
                          <p className="text-gray-400 text-xs">{u.email} · {u.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="mt-2 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                      {selectedUser.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900">{selectedUser.username}</p>
                      <p className="text-xs text-blue-600">{selectedUser.email}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="text-blue-400 hover:text-blue-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
              <input value={broadcastMsg.subject}
                onChange={e => setBroadcastMsg(p => ({ ...p, subject: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g. Scheduled Water Maintenance" />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
              <textarea value={broadcastMsg.body}
                onChange={e => setBroadcastMsg(p => ({ ...p, body: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4} placeholder="Type your message here..." />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button disabled={submitting} onClick={handleSend}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  broadcastMode === 'individual' ? 'Send Direct Message' : 'Send Broadcast'
                )}
              </button>
              <button disabled={submitting} onClick={() => { setShowBroadcast(false); resetBroadcast(); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
