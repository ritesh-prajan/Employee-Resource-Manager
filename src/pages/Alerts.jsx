import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell, Inbox, CheckCheck, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import AlertCard from '../components/alerts/AlertCard';
import ETABreachPopup from '../components/alerts/ETABreachPopup';
import DailyTaskPrompt, { shouldShowDailyPrompt } from '../components/alerts/DailyTaskPrompt';
import TaskAssignedToast from '../components/alerts/TaskAssignedToast';

// ─── Navigation helper ────────────────────────────────────────────────────────
function resolveNavTarget(type, role) {
  const prefix =
    role === 'Admin'                              ? 'admin-' :
    (role === 'Team Lead' || role === 'Sub Lead') ? 'lead-'  : '';

  switch (type) {
    case 'overdue':
      return prefix ? `${prefix}tasks` : 'tasks';
    case 'overtime':
      return prefix === 'admin-' ? 'admin-approvals'
           : prefix === 'lead-'  ? 'lead-requests'
           : 'dashboard';
    case 'TASK_ASSIGNED':
    case 'TASK_UPDATED':
    case 'TASK_REJECTED':
    case 'ETA_DECISION':
    case 'TRANSFER_DECISION':
    case 'BACKLOG_CLAIMED':
      return prefix ? `${prefix}tasks` : 'tasks';
    case 'TIMESHEET_APPROVED':
    case 'TIMESHEET_REJECTED':
    case 'APPROVAL_REVERTED':
      return prefix === 'admin-' ? 'admin-timesheets'
           : prefix === 'lead-'  ? 'lead-timesheet'
           : 'timesheet';
    case 'ETA_REQUEST':
    case 'TRANSFER_REQUEST':
      return prefix === 'admin-' ? 'admin-approvals'
           : prefix === 'lead-'  ? 'lead-requests'
           : 'dashboard';
    case 'WATCHDOG_LATE':
    case 'WATCHDOG_ABSENT':
      return 'admin-dashboard';
    case 'ANNOUNCEMENT':
      return prefix ? `${prefix}announcements` : 'announcements';
    case 'MEETING_REMINDER':
      return prefix ? `${prefix}meetings` : 'meetings';
    default:
      return prefix ? `${prefix}dashboard` : 'dashboard';
  }
}

const isSystemGenerated = (id) =>
  id && (id.startsWith('overdue') || id.startsWith('overtime'));

// ─── Tabs matching the screenshot exactly ────────────────────────────────────
const TABS = [
  { key: 'all',        label: 'All Alerts' },
  { key: 'unread',     label: 'Unread Only' },
  { key: 'crossedEta', label: 'Crossed ETA' },
  { key: 'system',     label: 'System Notifications' },
];

function matchesTab(n, tab) {
  switch (tab) {
    case 'unread':     return !n.isRead;
    case 'crossedEta': return n.type === 'overdue';
    case 'system':     return n.type !== 'overdue';
    default:           return true;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Alerts({ setCurrentPage }) {
  const {
    currentUser,
    notifications,
    tasks,
    users,
    teams,
    markNotificationRead,
    markNotificationUnread,
    deleteNotification,
    clearNotifications,
  } = useApp();

  const [tab, setTab] = useState('all');
  const [showETAPopup, setShowETAPopup] = useState(false);
  const [showDailyPrompt, setShowDailyPrompt] = useState(false);
  const [toastTask, setToastTask] = useState(null);
  const [seenToastIds, setSeenToastIds] = useState(new Set());

  const role = currentUser?.role;

  // Admin: ETA breach popup
  useEffect(() => {
    if (role !== 'Admin') return;
    const breached = tasks.filter(
      t => t.status !== 'Completed' && t.status !== 'Cancelled'
        && t.etaDate && new Date(t.etaDate) < new Date()
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
      .filter(n =>
        n.type === 'TASK_ASSIGNED' && !n.isRead
        && n.recipientId === currentUser?.id
        && !seenToastIds.has(n.id)
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (latest) {
      const taskObj = tasks.find(t => t.id === latest.entityId)
        || { name: latest.title, taskNumber: '' };
      setToastTask({ ...taskObj, _notifId: latest.id });
    }
  }, [notifications, role]);

  // Current user's notifications
  const mine = notifications.filter(n => n.recipientId === currentUser?.id);
  const unreadCount = mine.filter(n => !n.isRead).length;

  const filtered = mine
    .filter(n => matchesTab(n, tab))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const tabCount = (key) =>
    key === 'all' ? mine.length : mine.filter(n => matchesTab(n, key)).length;

  const handleNavigate = (n) => {
    if (!isSystemGenerated(n.id)) markNotificationRead(n.id);
    if (setCurrentPage) setCurrentPage(resolveNavTarget(n.type, role));
  };

  const handleToggleRead = (n) => {
    n.isRead ? markNotificationUnread(n.id) : markNotificationRead(n.id);
  };

  const handleMarkAllRead = () => {
    mine.filter(n => !n.isRead).forEach(n => markNotificationRead(n.id));
  };

  const etaBreaches = tasks.filter(
    t => t.status !== 'Completed' && t.status !== 'Cancelled'
      && t.etaDate && new Date(t.etaDate) < new Date()
  );

  const teamMembers = users.filter(u => {
    const myTeams = teams.filter(t => t.leadId === currentUser?.id);
    return myTeams.some(t => t.members.includes(u.id)) && u.id !== currentUser?.id;
  }).filter(u => {
    const today = new Date().toDateString();
    return !tasks.some(t => t.assignedTo === u.id && new Date(t.createdAt).toDateString() === today);
  });

  const dismissToast = (notifId, navigate = false) => {
    if (notifId) {
      setSeenToastIds(prev => new Set([...prev, notifId]));
      markNotificationRead(notifId);
    }
    setToastTask(null);
    if (navigate && setCurrentPage) setCurrentPage('tasks');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Header card — matches screenshot exactly ── */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 1.5rem', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.875rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            backgroundColor: 'var(--background)', color: 'vars(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={20} />
          </div>
          <div >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Alerts Center
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              You have {unreadCount} unread system notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                fontSize: '0.75rem', padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem', border: '1px solid var(--border)',
                background: 'none', color: 'var(--muted-foreground)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          {mine.length > 0 && (
            <button
              onClick={clearNotifications}
              style={{
                fontSize: '0.75rem', padding: '0.45rem 0.9rem',
                borderRadius: '0.5rem',
                border: '1px solid color-mix(in srgb, #ef4444 30%, transparent)',
                backgroundColor: 'color-mix(in srgb, #ef4444 6%, transparent)',
                color: '#ef4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
              }}
            >
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '0.35rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '2px', overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const count = tabCount(t.key);
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.6rem 1.1rem',
                background: 'none', border: 'none',
                borderBottom: active ? '2px solid #0010AE' : '2px solid transparent',
                color: active ? '#0010AE' : 'var(--muted-foreground)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              <span>{t.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: '0.65rem',
                  backgroundColor: active ? '#e6e8ff' : 'var(--secondary)',
                  color: active ? '#0010AE' : 'var(--muted-foreground)',
                  padding: '1px 6px', borderRadius: '10px', fontWeight: 700,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Feed — uses AlertCard ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div style={{
              padding: '4rem 2rem', textAlign: 'center',
              color: 'var(--muted-foreground)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              border: '1px dashed var(--border)', borderRadius: '0.875rem',
            }}>
              <Inbox size={32} style={{ opacity: 0.3 }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted-foreground)', margin: 0 }}>
                  No alerts here
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px', marginBottom: 0 }}>
                  There are no alerts matching this category.
                </p>
              </div>
            </div>
          ) : (
            filtered.map(n => (
              <AlertCard
                key={n.id}
                notification={n}
                onNavigate={handleNavigate}
                onToggleRead={handleToggleRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Admin: ETA breach popup ── */}
      {role === 'Admin' && showETAPopup && (
        <ETABreachPopup
          breaches={etaBreaches}
          onClose={() => setShowETAPopup(false)}
        />
      )}

      {/* ── Team Lead: daily task prompt ── */}
      {role === 'Team Lead' && showDailyPrompt && (
        <DailyTaskPrompt
          teamMembers={teamMembers}
          onClose={() => setShowDailyPrompt(false)}
          onAssign={() => {
            setShowDailyPrompt(false);
            if (setCurrentPage) setCurrentPage('lead-tasks');
          }}
        />
      )}

      {/* ── Employee: task assigned toast ── */}
      <TaskAssignedToast
        task={toastTask}
        onClose={() => dismissToast(toastTask?._notifId, false)}
        onView={() => dismissToast(toastTask?._notifId, true)}
      />
    </div>
  );
}