/**
 * @file useAnnouncements.js
 * @description Domain hook for company announcements, automatically publishing updates and sending push notifications.
 */

import { useState, useCallback } from 'react';

export function useAnnouncements({ currentUser, users = [], onAddNotification } = {}) {
  const [announcements, setAnnouncements] = useState([]);

  const createAnnouncement = useCallback((annData) => {
    const createdBy = currentUser?.name || 'Admin';
    const newAnn = {
      id: `ann-${Date.now()}`,
      title: annData.title,
      content: annData.content,
      createdBy,
      priority: annData.priority || 'info',
      createdAt: new Date().toISOString(),
      targetRole: annData.targetRole || "ALL",
      teams: annData.teams || [],
      projects: annData.projects || []
    };

    setAnnouncements(prev => [newAnn, ...prev]);

    // Send notifications to everyone except the creator
    if (onAddNotification && users) {
      users.forEach(u => {
        if (currentUser && String(u.id) !== String(currentUser.id)) {
          onAddNotification({
            id: `notif-${Date.now()}-${u.id}`,
            recipientId: u.id,
            type: "ANNOUNCEMENT",
            title: "New Company Announcement",
            message: `Announcement: '${newAnn.title}' by ${newAnn.createdBy}`,
            entityType: "ANNOUNCEMENT",
            entityId: newAnn.id,
            channel: "TEAMS",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      });
    }
  }, [currentUser, users, onAddNotification]);

  return {
    announcements,
    createAnnouncement
  };
}
