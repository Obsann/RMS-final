import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getNotifications as fetchNotificationsAPI, markNotificationRead, markAllNotificationsRead, dismissNotification } from '../utils/api';

// ── Context ──────────────────────────────────────────────────────────────────
export const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem('rms_token');
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchNotificationsAPI();
      setNotifications(data.notifications || data || []);
    } catch (e) {
      // Silently fail — not critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once on mount, and refresh every 60 seconds
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Computed helpers (role param kept for backward compat but ignored — all are per-user from API)
  const getNotificationList = useCallback(() => notifications, [notifications]);
  const getUnreadCount = useCallback(
    () => notifications.filter(n => !(n.isRead ?? n.read ?? false)).length,
    [notifications]
  );

  const markAsRead = useCallback(async (role, id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true, read: true } : n));
    } catch (e) { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async (role) => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    } catch (e) { /* silent */ }
  }, []);

  const dismiss = useCallback(async (role, id) => {
    try {
      await dismissNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) { /* silent */ }
  }, []);

  const pushNotification = useCallback((role, notification) => {
    const newNotif = {
      ...notification,
      _id: `local-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        getNotifications: getNotificationList,
        getUnreadCount,
        markAsRead,
        markAllAsRead,
        dismiss,
        pushNotification,
        reload: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
