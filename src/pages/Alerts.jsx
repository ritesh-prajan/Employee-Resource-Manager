import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell, Inbox, CheckCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AlertCard from '../components/alerts/AlertCard';
import ETABreachPopup from '../components/alerts/ETABreachPopup';
import DailyTaskPrompt, { shouldShowDailyPrompt } from '../components/alerts/DailyTaskPrompt';
import TaskAssignedToast from '../components/alerts/TaskAssignedToast';

const TABS = [
  { key: 'all',    label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read',   label: 'Read' },
];

export default function Alerts() {
  const {
    currentUser,
    notifications,
    tasks,
    users,
    teams,
    markNotificationRead,
    markNotificationUnread,
    deleteNotification,
  } = useApp();

  const [tab, setTab] = useState('all');
  const [showETAPopup, setShowETAPopup] = useState(false);
  const [showDailyPrompt, setShowDailyPrompt] = useState(false);
  const [toastTask, setToastTask] = useState(null);
  const [seenToastIds, setSeenToastIds] = useState(new Set());

  const role = currentUser?.role;

  // Admin: ETA breach popup on mount
  useEffect(() => {
    if (role !== 'Admin') return;
    const now = new Date();
    const breached = tasks.filter(
      t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.etaDate && new Date(t.etaDate) < now
    );
    if (breached.length > 0) setShowETAPopup(true);
  }, [role]);

  // Team Lead: daily task prompt
  useEffect(() => {
    if (role !== 'Team Lead') return;
    if (shouldShowDailyPrompt()) setShowDailyPrompt(true);
  }, [role]);

  // Employee: toast for latest unread TASK_ASSIGNED
  useEffect(() => {
    if (role !== 'Employee') return;
    const latest = notifications
      .filter(n => n.type === 'TASK_ASSIGNED' && !n.isRead && n.recipientId === currentUser?.id && !seenToastIds.has(n.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (latest) {
      const taskObj = tasks.find(t => t.id === latest.entityId) || { name: latest.title, taskNumber: '' };
      setToastTask({ ...taskObj, _notifId: latest.id });
    }
  }, [notifications, role]);

  // Filter notifications for current user
  const myNotifications = notifications.filter(
    n => n.recipientId === currentUser?.id
  );

  const filtered = myNotifications.filter(n => {
    if (tab === 'unread') return !n.isRead;
    if (tab === 'read')   return  n.isRead;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    myNotifications.filter(n => !n.isRead).forEach(n => markNotificationRead(n.id));
  };

  // ETA breached tasks for Admin popup
  const etaBreaches = tasks.filter(
    t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.etaDate && new Date(t.etaDate) < new Date()
  );

  // Team members with no tasks assigned today (for Team Lead prompt)
  const teamMembers = users.filter(u => {
    const myTeams = teams.filter(t => t.leadId === currentUser?.id);
    return myTeams.some(t => t.members.includes(u.id)) && u.id !== currentUser?.id;
  }).filter(u => {
    const today = new Date().toDateString();
    return !tasks.some(
      t => t.assignedTo === u.id && new Date(t.createdAt).toDateString() === today
    );
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '780px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={20} color="var(--primary)" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Alerts
            </h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
              border: '1px solid var(--border)', background: 'none',
              color: 'var(--muted-foreground)', fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.8rem',
              fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer',
              border: tab === t.key ? '1px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: tab === t.key
                ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                : 'transparent',
              color: tab === t.key ? 'var(--primary)' : 'var(--muted-foreground)',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            {t.key === 'unread' && unreadCount > 0 && (
              <span style={{
                marginLeft: '0.35rem', fontSize: '0.68rem',
                background: 'var(--primary)', color: 'var(--primary-foreground)',
                borderRadius: '999px', padding: '1px 6px',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem 1rem',
              color: 'var(--muted-foreground)',
              border: '1px dashed var(--border)',
              borderRadius: '0.875rem',
            }}>
              <Inbox size={38} style={{ marginBottom: '0.75rem', opacity: 0.35 }} />
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500 }}>No alerts here</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.7 }}>
                {tab === 'unread' ? "You're all caught up!" : 'Nothing to show'}
              </p>
            </div>
          ) : (
            filtered.map(n => (
              <AlertCard
                key={n.id}
                notification={n}
                onNavigate={(notif) => markNotificationRead(notif.id)}
                onToggleRead={() => n.isRead ? markNotificationUnread(n.id) : markNotificationRead(n.id)}
                onDelete={deleteNotification}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Admin: ETA breach popup */}
      {role === 'Admin' && showETAPopup && (
        <ETABreachPopup
          breaches={etaBreaches}
          onClose={() => setShowETAPopup(false)}
        />
      )}

      {/* Team Lead: daily prompt */}
      {role === 'Team Lead' && showDailyPrompt && (
        <DailyTaskPrompt
          teamMembers={teamMembers}
          onClose={() => setShowDailyPrompt(false)}
          onAssign={() => setShowDailyPrompt(false)}
        />
      )}

      {/* Employee: task assigned toast */}
      <TaskAssignedToast
        task={toastTask}
        onClose={() => {
          if (toastTask?._notifId) {
            setSeenToastIds(prev => new Set([...prev, toastTask._notifId]));
            markNotificationRead(toastTask._notifId);
          }
          setToastTask(null);
        }}
        onView={() => {
          if (toastTask?._notifId) {
            setSeenToastIds(prev => new Set([...prev, toastTask._notifId]));
            markNotificationRead(toastTask._notifId);
          }
          setToastTask(null);
        }}
      />
    </div>
  );
}