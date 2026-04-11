import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    Bell, Info, MessageSquare, AlertTriangle, Clock,
    X, Check, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../utils/api';

const TYPE_CONFIG = {
    announcement: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Announcement' },
    'digital-id-approved': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'ID Approved' },
    'digital-id-rejected': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'ID Rejected' },
    'request-update': { icon: Info, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Request Update' },
    approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Approved' },
    urgent: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Urgent' },
    message: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Message' },
};

const DEFAULT_CONFIG = { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Notification' };

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function ResidentNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeFilter, setActiveFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await api('/notifications');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, readStatus: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silently fail */ }
    };

    const markAllAsRead = async () => {
        try {
            await api('/notifications/read-all', { method: 'PATCH' });
            setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const dismissNotification = async (id) => {
        try {
            await api(`/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Notification dismissed');
        } catch {
            toast.error('Failed to dismiss notification');
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
        const notif = notifications.find(n => n._id === id);
        if (notif && !notif.readStatus) markAsRead(id);
    };

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'announcement', label: 'Announcements' },
        { key: 'approved', label: 'Approvals' },
    ];

    const filtered = notifications.filter(n => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !n.readStatus;
        return n.type === activeFilter || n.type?.includes(activeFilter);
    });

    // Group by day
    const grouped = filtered.reduce((acc, n) => {
        const d = new Date(n.createdAt);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const key = d >= today ? 'Today' : d >= yesterday ? 'Yesterday' : d.toLocaleDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(n);
        return acc;
    }, {});

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                            <Bell className="w-7 h-7 text-blue-600" />
                            My Notifications
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full text-sm font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                : 'All caught up!'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchNotifications}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex gap-2 flex-wrap">
                    {filters.map(f => {
                        const count = f.key === 'all' ? notifications.length
                            : f.key === 'unread' ? notifications.filter(n => !n.readStatus).length
                                : notifications.filter(n => n.type === f.key || n.type?.includes(f.key)).length;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${activeFilter === f.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {f.label}
                                {count > 0 && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === f.key ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No notifications here</p>
                        <p className="text-gray-400 text-sm mt-1">You'll see updates about your ID, requests, and announcements here.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([dateLabel, items]) => (
                            <div key={dateLabel}>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">{dateLabel}</p>
                                <div className="space-y-3">
                                    {items.map(notif => {
                                        const config = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
                                        const Icon = config.icon;
                                        const isExpanded = expandedId === notif._id;
                                        const isUnread = !notif.readStatus;

                                        return (
                                            <div
                                                key={notif._id}
                                                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isUnread ? 'border-blue-300 shadow-md' : 'border-gray-200 shadow-sm'
                                                    }`}
                                            >
                                                <div
                                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => toggleExpand(notif._id)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${config.bg} ${config.border} border mt-0.5`}>
                                                            <Icon className={`w-4 h-4 ${config.color}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    {isUnread && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                                                                    <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                                        {notif.title}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); dismissNotification(notif._id); }}
                                                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                                                                    {config.label}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                                    <Clock className="w-3 h-3" />
                                                                    {timeAgo(notif.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm text-gray-500 mt-1.5 ${!isExpanded ? 'line-clamp-1' : 'leading-relaxed'}`}>
                                                                {notif.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="px-4 pb-3 pt-2 border-t border-gray-100 flex gap-2">
                                                        <button
                                                            onClick={() => dismissNotification(notif._id)}
                                                            className="px-3 py-1.5 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
                                                        >
                                                            Dismiss
                                                        </button>
                                                        {isUnread && (
                                                            <button
                                                                onClick={() => markAsRead(notif._id)}
                                                                className="px-3 py-1.5 bg-blue-50 text-sm text-blue-600 rounded-lg hover:bg-blue-100"
                                                            >
                                                                Mark as read
                                                            </button>
                                                        )}
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
