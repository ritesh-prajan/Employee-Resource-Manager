import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Inbox, CheckCheck, Trash2, ChevronDown, X, CalendarX,
  Eye, EyeOff, ExternalLink, CheckSquare, Clock, Check, ShieldAlert,
  Calendar, Video, Megaphone, MessageSquare, UserX, TrendingUp, Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/ui/DataTable';
import SearchableSelect from '../components/ui/SearchableSelect';
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
    case 'TASK_COMMENTED':
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
  const [filterTask, setFilterTask]           = useState('');
  const [filterSender, setFilterSender]       = useState('');
  const [searchQuery, setSearchQuery]         = useState('');
  
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
  const mine = notifications.filter(n => String(n.recipientId) === String(currentUser?.id));
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

  // ── Global options for all tasks, projects, users ───────────────────────
  const allProjectOptions = useMemo(() => 
    projects.map(p => ({ value: p.id, label: p.name.split(' (')[0] }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [projects]);

  const allTaskOptions = useMemo(() => 
    tasks.map(t => ({ value: t.id, label: `${t.taskNumber || 'Task'}: ${t.name}` }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [tasks]);

  const allUserOptions = useMemo(() => 
    users.map(u => ({ value: u.id, label: u.name }))
      .sort((a, b) => a.label.localeCompare(b.label))
  , [users]);

  const hasActiveFilters = searchQuery || filterEmployee || filterTeam || filterProject || filterTask || filterSender;
  const clearFilters = () => {
    setSearchQuery('');
    setFilterEmployee('');
    setFilterTeam('');
    setFilterProject('');
    setFilterTask('');
    setFilterSender('');
  };

  // ── Apply ETA filters ─────────────────────────────────────────────────────
  const filteredBreaches = useMemo(() => {
    return etaBreaches.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = t.name.toLowerCase().includes(q);
        const idMatch = t.taskNumber?.toLowerCase().includes(q);
        const assignee = users.find(u => u.id === t.assignedTo);
        const assigneeMatch = assignee?.name.toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !assigneeMatch) return false;
      }
      if (filterEmployee && t.assignedTo !== filterEmployee) return false;
      if (filterProject  && t.projectId  !== filterProject)  return false;
      if (filterTask     && t.id         !== filterTask)     return false;
      if (filterTeam) {
        const team = teams.find(tm => tm.members.includes(t.assignedTo));
        if (!team || team.id !== filterTeam) return false;
      }
      return true;
    }).sort((a, b) => new Date(a.etaDate) - new Date(b.etaDate)); // oldest breach first
  }, [etaBreaches, searchQuery, filterEmployee, filterProject, filterTask, filterTeam, users]);

  // ── Regular notification feed (all/unread/system tabs) ───────────────────
  const filteredNotifs = useMemo(() => {
    return mine
      .filter(n => matchesTab(n, tab))
      .filter(n => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const titleMatch = n.title?.toLowerCase().includes(q);
          const msgMatch = n.message?.toLowerCase().includes(q);
          const senderMatch = n.senderName?.toLowerCase().includes(q);
          if (!titleMatch && !msgMatch && !senderMatch) return false;
        }
        if (filterProject) {
          if (n.entityType === 'TASK') {
            const task = tasks.find(t => t.id === n.entityId);
            if (!task || task.projectId !== filterProject) return false;
          } else {
            return false;
          }
        }
        if (filterTask) {
          if (n.entityType !== 'TASK' || n.entityId !== filterTask) return false;
        }
        if (filterSender && String(n.senderId) !== String(filterSender)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [mine, tab, searchQuery, filterProject, filterTask, filterSender, tasks]);

  const tabCount = (key) => {
    if (key === 'crossedEta') return etaBreaches.length;
    if (key === 'all')        return mine.length;
    return mine.filter(n => matchesTab(n, key)).length;
  };
  const navigate=useNavigate();
  const handleNavigate = useCallback((n) => {
    if (n && n.id && !isSystemGenerated(n.id)) markNotificationRead(n.id);
    const targetPath = `/${resolveNavTarget(n?.type || 'overdue', role)}`;
    if (n?.entityType === 'TASK') {
      navigate(targetPath, { state: { highlightTaskId: n.entityId } });
    } else {
      navigate(targetPath);
    }
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
    <div className="tasks-page-container">
      <div className="tasks-toolbar-wrapper">
        <div className="tasks-filter-card" style={{ width: '100%' }}>
          <div className="tasks-filter-row" style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
            <div className="flex items-center gap-2 flex-shrink-1 min-w-0" style={{ flexWrap: 'nowrap' }}>
              <div className="tasks-search-box" style={{ width: '160px', flexShrink: 1 }}>
                <Search size={14} className="tasks-search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="tasks-search-input"
                />
              </div>

              <div className="flex items-center">
                <SearchableSelect
                  options={[{ value: '', label: 'All Projects' }, ...allProjectOptions]}
                  value={filterProject}
                  onChange={setFilterProject}
                  placeholder="All Projects"
                  style={{ width: '140px' }}
                />
              </div>

              <div className="flex items-center">
                <SearchableSelect
                  options={[{ value: '', label: 'All Tasks' }, ...allTaskOptions]}
                  value={filterTask}
                  onChange={setFilterTask}
                  placeholder="All Tasks"
                  style={{ width: '130px' }}
                />
              </div>

              {tab === 'crossedEta' ? (
                <>
                  <div className="flex items-center">
                    <SearchableSelect
                      options={[{ value: '', label: 'All Employees' }, ...employeeOptions]}
                      value={filterEmployee}
                      onChange={setFilterEmployee}
                      placeholder="All Employees"
                      style={{ width: '130px' }}
                    />
                  </div>
                  {(role === 'Admin' || role === 'Team Lead' || role === 'Sub Lead') && (
                    <div className="flex items-center">
                      <SearchableSelect
                        options={[{ value: '', label: 'All Teams' }, ...teamOptions]}
                        value={filterTeam}
                        onChange={setFilterTeam}
                        placeholder="All Teams"
                        style={{ width: '130px' }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center">
                  <SearchableSelect
                    options={[{ value: '', label: 'All Senders' }, ...allUserOptions]}
                    value={filterSender}
                    onChange={setFilterSender}
                    placeholder="All Senders"
                    style={{ width: '130px' }}
                  />
                </div>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: '32px' }}
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0" style={{ marginLeft: 'auto', flexWrap: 'nowrap' }}>
              <div className="tasks-scope-toggle" style={{ flexWrap: 'nowrap' }}>
                {TABS.map(t => {
                  const count = tabCount(t.key);
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`tasks-scope-btn ${active ? 'active' : 'inactive'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      {t.label}
                      {count > 0 && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'var(--secondary)',
                          color: active ? '#white' : 'var(--muted-foreground)',
                          padding: '1px 5px',
                          borderRadius: '8px',
                          marginLeft: '2px'
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem', marginTop: '1.25rem' }}>
        {tab === 'crossedEta' ? (
          <>
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
                  {hasActiveFilters ? 'No alerts match your filter selections.' : 'There are no alerts matching this category.'}
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
      </div>

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
