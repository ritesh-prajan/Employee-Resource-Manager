import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Inbox, CheckCheck, Trash2, ChevronDown, X, CalendarX,
  Eye, EyeOff, ExternalLink, CheckSquare, Clock, Check, ShieldAlert,
  Calendar, Video, Megaphone, MessageSquare, UserX, TrendingUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/ui/DataTable';
import ETABreachPopup from '../components/alerts/ETABreachPopup';
import DailyTaskPrompt, { shouldShowDailyPrompt } from '../components/alerts/DailyTaskPrompt';
import TaskAssignedToast from '../components/alerts/TaskAssignedToast';
import { useNavigate } from 'react-router-dom';

const TYPE_META = {
  TASK_ASSIGNED:      { icon: CheckSquare, color: 'var(--primary)', label: 'Task Assigned' },
  TASK_UPDATED:       { icon: Clock,        color: '#2dd4bf',        label: 'Task Updated' },
  TASK_REJECTED:      { icon: ShieldAlert,  color: '#ef4444',        label: 'Task Rejected' },
  TIMESHEET_APPROVED: { icon: Check,        color: '#4ade80',        label: 'Approved' },
  TIMESHEET_REJECTED: { icon: ShieldAlert,  color: '#ef4444',        label: 'Rejected' },
  APPROVAL_REVERTED:  { icon: Clock,        color: '#fbbf24',        label: 'Reverted' },
  BACKLOG_CLAIMED:    { icon: CheckSquare,  color: '#2dd4bf',        label: 'Backlog Claimed' },
  BACKLOG_CLAIM_REQUEST: { icon: CheckSquare, color: '#3b82f6',        label: 'Claim Request' },
  ETA_REQUEST:        { icon: Calendar,     color: '#fbbf24',        label: 'ETA Request' },
  ETA_DECISION:       { icon: Calendar,     color: '#fbbf24',        label: 'ETA Decision' },
  TRANSFER_REQUEST:   { icon: ShieldAlert,  color: '#c084fc',        label: 'Transfer Request' },
  TRANSFER_DECISION:  { icon: ShieldAlert,  color: '#c084fc',        label: 'Transfer Decision' },
  MEETING_REMINDER:   { icon: Video,        color: '#06b6d4',        label: 'Meeting' },
  ANNOUNCEMENT:       { icon: Megaphone,    color: '#ec4899',        label: 'Announcement' },
  WATCHDOG_LATE:      { icon: Clock,        color: '#fbbf24',        label: 'Late Check-in' },
  WATCHDOG_ABSENT:    { icon: UserX,        color: '#ef4444',        label: 'Absent' },
  overdue:            { icon: CalendarX,    color: '#ef4444',        label: 'Overdue' },
  overtime:           { icon: TrendingUp,   color: '#fbbf24',        label: 'Overtime' },
};

const DEFAULT_META = { icon: MessageSquare, color: '#8b939c', label: 'Notification' };


// ─── Navigation helper ────────────────────────────────────────────────────────
function resolveNavTarget(type, role) {
  const prefix =
    role === 'Admin'                              ? 'admin/' :
    (role === 'Team Lead' || role === 'Sub Lead') ? 'lead/'  : '';
  switch (type) {
    case 'overdue':           return prefix ? `${prefix}tasks` : 'tasks';
    case 'overtime':          return prefix === 'admin/' ? 'admin/approvals' : prefix === 'lead/' ? 'lead/requests' : 'dashboard';
    case 'TASK_ASSIGNED':
    case 'TASK_UPDATED':
    case 'TASK_REJECTED':
    case 'ETA_DECISION':
    case 'TRANSFER_DECISION':
    case 'BACKLOG_CLAIMED':
    case 'BACKLOG_CLAIM_REQUEST':   return prefix ? `${prefix}tasks` : 'tasks';
    case 'TIMESHEET_APPROVED':
    case 'TIMESHEET_REJECTED':
    case 'APPROVAL_REVERTED': return prefix === 'admin/' ? 'admin/timesheets' : prefix === 'lead/' ? 'lead/timesheet' : 'timesheet';
    case 'ETA_REQUEST':
    case 'TRANSFER_REQUEST':  return prefix === 'admin/' ? 'admin/approvals' : prefix === 'lead/' ? 'lead/requests' : 'dashboard';
    case 'WATCHDOG_LATE':
    case 'WATCHDOG_ABSENT':   return 'admin/dashboard';
    case 'ANNOUNCEMENT':      return prefix ? `${prefix}announcements` : 'announcements';
    case 'MEETING_REMINDER':  return prefix ? `${prefix}meetings` : 'meetings';
    default:                  return prefix ? `${prefix}dashboard` : 'dashboard';
  }
}

const isSystemGenerated = (id) =>
  id && (id.startsWith('overdue') || id.startsWith('overtime'));

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all',        label: 'All Alerts' },
  { key: 'unread',     label: 'Unread Only' },
  { key: 'crossedEta', label: 'Crossed ETA' },
  { key: 'system',     label: 'System Notifications' },
];

function matchesTab(n, tab) {
  switch (tab) {
    case 'unread':  return !n.isRead;
    case 'system':  return n.type !== 'overdue';
    default:        return true;
  }
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          padding: '0.38rem 2rem 0.38rem 0.75rem',
          fontSize: '0.775rem',
          fontWeight: value ? 600 : 400,
          color: value ? 'var(--foreground)' : 'var(--muted-foreground)',
          backgroundColor: value
            ? 'color-mix(in srgb, var(--primary) 8%, var(--card))'
            : 'var(--card)',
          border: value
            ? '1px solid color-mix(in srgb, var(--primary) 35%, transparent)'
            : '1px solid var(--border)',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '130px',
        }}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={12} style={{
        position: 'absolute', right: '0.5rem',
        color: 'var(--muted-foreground)', pointerEvents: 'none',
      }} />
    </div>
  );
}



// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Alerts() {
  const {
    currentUser, notifications, tasks, users, projects, teams,
    markNotificationRead, markNotificationUnread,
    deleteNotification, clearNotifications,
    approveClaimRequest, rejectClaimRequest
  } = useApp();

  const [tab, setTab]                         = useState('all');
  const [showETAPopup, setShowETAPopup]       = useState(false);
  const [showDailyPrompt, setShowDailyPrompt] = useState(false);
  const [toastTask, setToastTask]             = useState(null);
  const [seenToastIds, setSeenToastIds]       = useState(new Set());
  const [filterEmployee, setFilterEmployee]   = useState('');
  const [filterTeam, setFilterTeam]           = useState('');
  const [filterProject, setFilterProject]     = useState('');
  
  const role = currentUser?.role;

  // ── All breached tasks — same source as the popup ──────────────────────────
  const etaBreaches = useMemo(() => tasks.filter(t =>
    t.status !== 'Completed' && t.status !== 'Cancelled'
    && t.etaDate && new Date(t.etaDate) < new Date()
  ), [tasks]);

  // Guard via sessionStorage instead of useRef so the "already shown" flag
  // survives StrictMode's intentional double-mount in dev, and survives
  // navigating away from /alerts and back during the same browser session.
  useEffect(() => {
    if (role !== 'Admin') return;
    const alreadyShown = sessionStorage.getItem('etaPopupShown') === 'true';
    if (etaBreaches.length > 0 && !alreadyShown) {
      setShowETAPopup(true);
    }
  }, [role, etaBreaches.length]);

  useEffect(() => {
    if (role !== 'Team Lead' && role !== 'Sub Lead') return;
    const alreadyShown = sessionStorage.getItem('dailyPromptShown') === 'true';
    if (!alreadyShown && shouldShowDailyPrompt()) {
      setShowDailyPrompt(true);
    }
  }, [role]);

  useEffect(() => {
    if (role !== 'Employee') return;
    const latest = notifications
      .filter(n => n.type === 'TASK_ASSIGNED' && !n.isRead
        && n.recipientId === currentUser?.id && !seenToastIds.has(n.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (latest) {
      const taskObj = tasks.find(t => t.id === latest.entityId) || { name: latest.title, taskNumber: '' };
      setToastTask({ ...taskObj, _notifId: latest.id });
    }
  }, [notifications, role, currentUser, seenToastIds, tasks]);

  // ── Regular notifications (non-overdue) ────────────────────────────────────
  const mine = notifications.filter(n => n.recipientId === currentUser?.id);
  const unreadCount = mine.filter(n => !n.isRead).length;

  // ── Filter options built from etaBreaches ─────────────────────────────────
  const employeeOptions = useMemo(() =>
    [...new Map(
      etaBreaches
        .map(t => users.find(u => u.id === t.assignedTo))
        .filter(Boolean)
        .map(u => [u.id, u])
    ).values()]
      .map(u => ({ value: u.id, label: u.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [etaBreaches, users]);

  const teamOptions = useMemo(() =>
    [...new Map(
      etaBreaches
        .map(t => teams.find(tm => tm.members.includes(t.assignedTo)))
        .filter(Boolean)
        .map(tm => [tm.id, tm])
    ).values()]
      .map(tm => ({ value: tm.id, label: tm.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [etaBreaches, teams]);

  const projectOptions = useMemo(() =>
    [...new Map(
      etaBreaches
        .map(t => projects.find(p => p.id === t.projectId))
        .filter(Boolean)
        .map(p => [p.id, p])
    ).values()]
      .map(p => ({ value: p.id, label: p.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [etaBreaches, projects]);

  const hasActiveFilters = filterEmployee || filterTeam || filterProject;
  const clearFilters = () => { setFilterEmployee(''); setFilterTeam(''); setFilterProject(''); };

  // ── Apply ETA filters ─────────────────────────────────────────────────────
  const filteredBreaches = useMemo(() => {
    return etaBreaches.filter(t => {
      if (filterEmployee && t.assignedTo !== filterEmployee) return false;
      if (filterProject  && t.projectId  !== filterProject)  return false;
      if (filterTeam) {
        const team = teams.find(tm => tm.members.includes(t.assignedTo));
        if (!team || team.id !== filterTeam) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.etaDate) - new Date(b.etaDate)); // oldest breach first
  }, [etaBreaches, filterEmployee, filterTeam, filterProject, teams]);

  // ── Regular notification feed (all/unread/system tabs) ───────────────────
  const filteredNotifs = useMemo(() =>
    mine
      .filter(n => matchesTab(n, tab))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  , [mine, tab]);

  const tabCount = (key) => {
    if (key === 'crossedEta') return etaBreaches.length;
    if (key === 'all')        return mine.length;
    return mine.filter(n => matchesTab(n, key)).length;
  };
  const navigate=useNavigate();
  const handleNavigate = useCallback((n) => {
    if (n && n.id && !isSystemGenerated(n.id)) markNotificationRead(n.id);
    navigate(`/${resolveNavTarget(n?.type || 'overdue', role)}`);
  }, [markNotificationRead, navigate, role]);

  const handleNavigateTask = useCallback((taskId) => {
    const targetPath = role === 'Admin' ? '/admin/tasks' : role === 'Team Lead' || role === 'Sub Lead' ? '/lead/tasks' : '/tasks';
    navigate(targetPath, { state: { highlightTaskId: taskId } });
  }, [role, navigate]);

  const handleToggleRead  = useCallback((n) => n.isRead ? markNotificationUnread(n.id) : markNotificationRead(n.id), [markNotificationRead, markNotificationUnread]);
  const handleMarkAllRead = () => mine.filter(n => !n.isRead).forEach(n => markNotificationRead(n.id));

  const teamMembers = users.filter(u => {
    const myTeams = teams.filter(t => String(t.leadId) === String(currentUser?.id) || String(t.subLeadId) === String(currentUser?.id));
    return myTeams.some(t => t.members.includes(u.id)) && u.id !== currentUser?.id;
  }).filter(u => {
    const today = new Date().toDateString();
    return !tasks.some(t => t.assignedTo === u.id && new Date(t.createdAt).toDateString() === today);
  });

  const dismissToast = (notifId, shouldNavigate = false) => {
    if (notifId) {
      setSeenToastIds(prev => new Set([...prev, notifId]));
      markNotificationRead(notifId);
    }
    setToastTask(null);
    if (shouldNavigate) navigate('/tasks');
  };


  const notifColumns = useMemo(() => [
    {
      id: 'icon',
      header: '',
      cell: ({ row }) => {
        const n = row.original;
        const meta = TYPE_META[n.type] || DEFAULT_META;
        const Icon = meta.icon;
        return (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${meta.color} 22%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} style={{ color: meta.color }} />
          </div>
        );
      }
    },
    {
      accessorKey: 'title',
      header: 'NOTIFICATION',
      cell: ({ row }) => {
        const n = row.original;
        const meta = TYPE_META[n.type] || DEFAULT_META;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: n.isRead ? 500 : 700, color: 'var(--foreground)' }}>
                {n.title}
              </span>
              <span style={{
                fontSize: '0.62rem', fontWeight: 600,
                color: meta.color,
                backgroundColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${meta.color} 22%, transparent)`,
                borderRadius: 4, padding: '1px 6px',
              }}>
                {meta.label}
              </span>
              {!n.isRead && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: '#0010AE',
                }} />
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{n.message}</span>
            {n.type === 'BACKLOG_CLAIM_REQUEST' && !n.isRead && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => approveClaimRequest(n)}
                  style={{
                    padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600,
                    backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  Agree
                </button>
                <button
                  onClick={() => rejectClaimRequest(n)}
                  style={{
                    padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 600,
                    backgroundColor: 'color-mix(in srgb, var(--destructive) 10%, transparent)', color: 'var(--destructive)',
                    border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'DATE RECEIVED',
      cell: ({ getValue }) => {
        const val = getValue();
        return (
          <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
            {new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            {' '}
            {new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => {
        const n = row.original;
        return (
          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleToggleRead(n)}
              title={n.isRead ? 'Mark as unread' : 'Mark as read'}
              className="p-1 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              {n.isRead ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => handleNavigate(n)}
              title="View details"
              className="p-1 rounded border border-slate-200 bg-white text-[#0010AE] hover:bg-slate-50 cursor-pointer"
            >
              <ExternalLink size={13} />
            </button>
            <button
              onClick={() => deleteNotification(n.id)}
              title="Dismiss"
              className="p-1 rounded border border-slate-200 bg-white text-red-500 hover:bg-slate-50 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], [approveClaimRequest, rejectClaimRequest, handleToggleRead, handleNavigate, deleteNotification]);

  const etaColumns = useMemo(() => [
    {
      accessorKey: 'taskNumber',
      header: 'TASK ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500 whitespace-nowrap">
          {getValue()}
        </span>
      )
    },
    {
      accessorKey: 'name',
      header: 'TASK NAME',
      cell: ({ row }) => {
        const task = row.original;
        const project = projects.find(p => p.id === task.projectId);
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{task.name}</span>
            {project && (
              <span style={{ fontSize: '0.75rem', color: project.color || 'var(--muted-foreground)' }}>
                {project.name.split(' (')[0]}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'assignee',
      header: 'ASSIGNEE',
      cell: ({ row }) => {
        const task = row.original;
        const assignee = users.find(u => u.id === task.assignedTo);
        const team = teams.find(tm => tm.members.includes(task.assignedTo));
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{assignee?.name || 'Unassigned'}</span>
            {team && <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{team.name}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: 'etaDate',
      header: 'DUE DATE',
      cell: ({ getValue }) => {
        const val = getValue();
        const daysOverdue = val
          ? Math.max(0, Math.floor((new Date() - new Date(val)) / (1000 * 60 * 60 * 24)))
          : null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--destructive)', fontWeight: 600 }}>
              {val ? new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </span>
            {daysOverdue !== null && daysOverdue > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--destructive)' }}>
                Overdue by {daysOverdue}d
              </span>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ getValue }) => (
        <span style={{
          fontSize: '0.65rem', fontWeight: 700,
          color: 'var(--muted-foreground)',
          backgroundColor: 'var(--secondary)',
          border: '1px solid var(--border)',
          borderRadius: 4, padding: '2px 7px',
          textTransform: 'uppercase'
        }}>
          {getValue()}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleNavigateTask(task.id)}
              title="Go to task"
              className="p-1 rounded border border-slate-200 bg-white text-[#0010AE] hover:bg-slate-50 cursor-pointer"
            >
              <ExternalLink size={13} />
            </button>
          </div>
        );
      }
    }
  ], [projects, users, teams, handleNavigateTask]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── Header card ── */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 1.5rem', flexWrap: 'wrap', gap: '1rem',backgroundColor: 'var(--card)',borderRadius: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px',
            backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              Alerts Center
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              You have {unreadCount} unread system notification{unreadCount !== 1 ? 's' : ''}
              {etaBreaches.length > 0 && (
                <span style={{ color: 'var(--destructive)', marginLeft: '0.5rem', fontWeight: 600 }}>
                  · {etaBreaches.length} ETA breach{etaBreaches.length !== 1 ? 'es' : ''}
                </span>
              )}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{
              fontSize: '0.75rem', padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
              border: '1px solid var(--border)', background: 'none',
              color: 'var(--muted-foreground)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          {mine.length > 0 && (
            <button onClick={clearNotifications} style={{
              fontSize: '0.75rem', padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
              border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
              backgroundColor: 'color-mix(in srgb, var(--destructive) 6%, transparent)',
              color: 'var(--destructive)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
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
          const isEta  = t.key === 'crossedEta';
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.6rem 1.1rem', background: 'none', border: 'none',
                borderBottom: active
                  ? `2px solid ${isEta ? 'var(--destructive)' : 'var(--primary)'}`
                  : '2px solid transparent',
                color: active
                  ? (isEta ? 'var(--destructive)' : 'var(--primary)')
                  : 'var(--muted-foreground)',
                fontWeight: active ? 700 : 500, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
            >
              {isEta && <CalendarX size={13} />}
              <span>{t.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  backgroundColor: active
                    ? (isEta
                        ? 'color-mix(in srgb, var(--destructive) 12%, transparent)'
                        : 'color-mix(in srgb, var(--primary) 12%, transparent)')
                    : 'var(--secondary)',
                  color: active
                    ? (isEta ? 'var(--destructive)' : 'var(--primary)')
                    : 'var(--muted-foreground)',
                  padding: '1px 6px', borderRadius: '10px',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Crossed ETA: filters + task table ── */}
      {tab === 'crossedEta' ? (
        <>
          {/* Filters */}
          {etaBreaches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <FilterSelect label="Employee" value={filterEmployee} onChange={setFilterEmployee} options={employeeOptions} />
              <FilterSelect label="Team"     value={filterTeam}     onChange={setFilterTeam}     options={teamOptions} />
              <FilterSelect label="Project"  value={filterProject}  onChange={setFilterProject}  options={projectOptions} />
              {hasActiveFilters && (
                <button onClick={clearFilters} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.38rem 0.7rem', borderRadius: '0.5rem',
                  border: '1px solid var(--border)', background: 'none',
                  color: 'var(--muted-foreground)', fontSize: '0.75rem', cursor: 'pointer',
                }}>
                  <X size={12} /> Clear
                </button>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                {filteredBreaches.length} of {etaBreaches.length} task{etaBreaches.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* ETA breach table */}
          {filteredBreaches.length === 0 ? (
            <div style={{
              padding: '4rem 2rem', textAlign: 'center',
              border: '1px dashed var(--border)', borderRadius: '0.875rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              backgroundColor: 'var(--card)'
            }}>
              <CalendarX size={32} style={{ opacity: 0.3, color: 'var(--destructive)' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  {hasActiveFilters ? 'No results match your filters' : 'No ETA breaches'}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {hasActiveFilters ? 'Try adjusting or clearing the filters.' : 'All tasks are on track.'}
                </p>
              </div>
            </div>
          ) : (
            <DataTable
              Data={filteredBreaches}
              columns={etaColumns}
              onRowClick={(task) => handleNavigateTask(task.id)}
            />
          )}
        </>
      ) : (
        /* ── Regular notification feed ── */
        filteredNotifs.length === 0 ? (
          <div style={{
            padding: '4rem 2rem', textAlign: 'center',
            border: '1px dashed var(--border)', borderRadius: '0.875rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
            backgroundColor: 'var(--card)'
          }}>
            <Inbox size={32} style={{ opacity: 0.3 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                No alerts here
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                There are no alerts matching this category.
              </p>
            </div>
          </div>
        ) : (
          <DataTable
            Data={filteredNotifs}
            columns={notifColumns}
            onRowClick={(n) => handleNavigate(n)}
          />
        )
      )}

      {/* ── Modals & toasts ── */}
      <ETABreachPopup
        isOpen={role === 'Admin' && showETAPopup}
        breaches={etaBreaches}
        onClose={() => {
          setShowETAPopup(false);
          sessionStorage.setItem('etaPopupShown', 'true');
        }}
      />
      <DailyTaskPrompt
        isOpen={(role === 'Team Lead' || role === 'Sub Lead') && showDailyPrompt}
        teamMembers={teamMembers}
        onClose={() => {
          setShowDailyPrompt(false);
          sessionStorage.setItem('dailyPromptShown', 'true');
        }}
        onAssign={() => {
          setShowDailyPrompt(false);
          sessionStorage.setItem('dailyPromptShown', 'true');
          navigate('/lead/tasks');
        }}
      />
      <TaskAssignedToast
        task={toastTask}
        onClose={() => dismissToast(toastTask?._notifId, false)}
        onView={() => dismissToast(toastTask?._notifId, true)}
      />
    </div>
  );
}
