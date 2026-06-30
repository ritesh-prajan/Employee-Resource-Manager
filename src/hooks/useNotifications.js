/**
 * @file useNotifications.js
 * @description Domain hook managing list and status of system and workspace notifications.
 */

import { useState, useCallback, useEffect } from 'react';

export function useNotifications() {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('erm_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse notifications from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('erm_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notif) => {
    setNotifications(prev => [notif, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const markNotificationUnread = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: false } : n)
    );
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    setNotifications,
    addNotification,
    markNotificationRead,
    markNotificationUnread,
    deleteNotification,
    clearNotifications,
  };
}
