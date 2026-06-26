import React, { useState, useMemo } from 'react';
import { UserCheck, CheckSquare, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useTasks } from '../../hooks/useTasks';

import ApprovalKpiBar      from '../../components/approvals/ApprovalKpiBar';
import ApprovalTabToggle   from '../../components/approvals/ApprovalTabToggle';
import ApprovalFilterBar   from '../../components/approvals/ApprovalFilterBar';
import ApprovalTable       from '../../components/approvals/ApprovalTable';
import ApprovalTaskTable   from '../../components/approvals/ApprovalTaskTable';

export default function Approvals() {
  const {
    currentUser,
    timeEntries,
    users,
    projects,
    tasks,
    teams,
    updateEntryStatus,
    revertEntryStatus,
  } = useApp();

  const toast = useToast();

  const isAdmin = currentUser?.role === 'Admin';

  // Team lead scope — members of teams this user leads
  const ledMemberIds = useMemo(() => {
    if (isAdmin) return null; // null = no scope restriction
    const ledTeams = teams.filter((t) => String(t.leadId) === String(currentUser?.id) || String(t.subLeadId) === String(currentUser?.id));
    return new Set(ledTeams.flatMap((t) => t.members));
  }, [isAdmin, teams, currentUser]);

  const {
    approveTaskReview,
    rejectTaskReview,
    undoTaskReview
  } = useTasks();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [activeCategoryTab,  setActiveCategoryTab]  = useState('timelogs'); // 'timelogs' | 'tasks'
  const [showHistory,        setShowHistory]        = useState(false);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedUserId,     setSelectedUserId]     = useState('');
  const [selectedProjectId,  setSelectedProjectId]  = useState('');
  const [showOnlyOverruns,   setShowOnlyOverruns]   = useState(false);
  const [comments,           setComments]           = useState({}); // { [entryId]: string }
  const [taskComments,       setTaskComments]       = useState({}); // { [taskId]: string }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUser    = (id) => users.find((u) => u.id === id);
  const getTask    = (id) => tasks.find((t) => t.id === id);
  const getProject = (id) => projects.find((p) => p.id === id);

  // ── Filtered entries ──────────────────────────────────────────────────────
  const filteredEntries = useMemo(() => {
    return timeEntries.filter((e) => {
      // Scope: TL can only see their team members
      if (!isAdmin && ledMemberIds && !ledMemberIds.has(e.userId)) return false;

      // Tab: pending vs history
      if (showHistory) {
        if (e.status !== 'Approved' && e.status !== 'Rejected') return false;
      } else {
        if (e.status !== 'Pending') return false;
      }

      // User filter
      if (selectedUserId && e.userId !== selectedUserId) return false;

      // Project filter
      if (selectedProjectId && e.projectId !== selectedProjectId) return false;

      // ETA overrun filter: entry has justification AND task is over ETA
      if (showOnlyOverruns) {
        if (!e.justification) return false;
        const t = getTask(e.taskId);
        if (!t || t.logged <= t.eta) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const u = getUser(e.userId);
        const t = getTask(e.taskId);
        const p = getProject(e.projectId);
        const hit =
          (u && u.name.toLowerCase().includes(q)) ||
          (t && t.name.toLowerCase().includes(q)) ||
          (t && t.taskNumber.toLowerCase().includes(q)) ||
          (p && p.name.toLowerCase().includes(q)) ||
          (e.description && e.description.toLowerCase().includes(q));
        if (!hit) return false;
      }

      return true;
    });
  }, [
    timeEntries, isAdmin, ledMemberIds, showHistory,
    selectedUserId, selectedProjectId, showOnlyOverruns, searchQuery,
    tasks, users, projects,
  ]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Scope: TL can only see their team members
      if (!isAdmin && ledMemberIds && !ledMemberIds.has(t.assignedTo)) return false;

      // Tab: pending vs history
      if (showHistory) {
        if (t.completionReviewStatus !== 'APPROVED' && t.completionReviewStatus !== 'REJECTED') return false;
      } else {
        if (t.status !== 'Pending Review') return false;
      }

      // User filter
      if (selectedUserId && t.assignedTo !== selectedUserId) return false;

      // Project filter
      if (selectedProjectId && t.projectId !== selectedProjectId) return false;

      // ETA overrun filter: task is over ETA
      if (showOnlyOverruns) {
        if (t.logged <= t.eta) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const u = getUser(t.assignedTo);
        const p = getProject(t.projectId);
        const hit =
          t.name.toLowerCase().includes(q) ||
          (t.taskNumber && t.taskNumber.toLowerCase().includes(q)) ||
          (u && u.name.toLowerCase().includes(q)) ||
          (p && p.name.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q));
        if (!hit) return false;
      }

      return true;
    });
  }, [
    tasks, isAdmin, ledMemberIds, showHistory,
    selectedUserId, selectedProjectId, showOnlyOverruns, searchQuery,
    users, projects,
  ]);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const kpiCounts = useMemo(() => {
    const scoped = isAdmin
      ? timeEntries
      : timeEntries.filter((e) => ledMemberIds?.has(e.userId));
    return {
      pending:  scoped.filter((e) => e.status === 'Pending').length,
      approved: scoped.filter((e) => e.status === 'Approved').length,
      rejected: scoped.filter((e) => e.status === 'Rejected').length,
      overruns: scoped.filter((e) => {
        const t = getTask(e.taskId);
        return e.justification && t && t.logged > t.eta;
      }).length,
    };
  }, [timeEntries, isAdmin, ledMemberIds, tasks]);

  const taskKpiCounts = useMemo(() => {
    const scoped = isAdmin
      ? tasks
      : tasks.filter((t) => ledMemberIds?.has(t.assignedTo));
    return {
      pending:  scoped.filter((t) => t.status === 'Pending Review').length,
      approved: scoped.filter((t) => t.completionReviewStatus === 'APPROVED').length,
      rejected: scoped.filter((t) => t.completionReviewStatus === 'REJECTED').length,
      overruns: scoped.filter((t) => t.logged > t.eta).length,
    };
  }, [tasks, isAdmin, ledMemberIds]);

  const activeKpiCounts = activeCategoryTab === 'timelogs' ? kpiCounts : taskKpiCounts;

  // ── Filter dropdown options ───────────────────────────────────────────────
  const userOptions = useMemo(
    () => users.filter((u) => isAdmin || ledMemberIds?.has(u.id)),
    [users, isAdmin, ledMemberIds]
  );

  const projectOptions = useMemo(() => {
    if (isAdmin) return projects;
    const myTeamIds = teams.filter((t) => String(t.leadId) === String(currentUser?.id) || String(t.subLeadId) === String(currentUser?.id)).map((t) => t.id);
    return projects.filter((p) => (p.teams || []).some((tid) => myTeamIds.includes(tid)));
  }, [projects, isAdmin, teams, currentUser]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = (entryId) => {
    updateEntryStatus(entryId, 'Approved', comments[entryId] || '');
    setComments((prev) => { const c = { ...prev }; delete c[entryId]; return c; });
  };

  const handleReject = (entryId) => {
    if (!comments[entryId]?.trim()) {
      toast.warning('Please add feedback before rejecting.');
      return;
    }
    updateEntryStatus(entryId, 'Rejected', comments[entryId]);
    setComments((prev) => { const c = { ...prev }; delete c[entryId]; return c; });
  };

  const handleRevert = (entryId) => {
    revertEntryStatus(entryId);
  };

  const handleCommentChange = (entryId, val) => {
    setComments((prev) => ({ ...prev, [entryId]: val }));
  };

  const handleTaskApprove = (taskId) => {
    approveTaskReview.mutate({ taskid: taskId, comment: taskComments[taskId] || '' }, {
      onSuccess: () => {
        toast.success('Task approved successfully');
        setTaskComments((prev) => { const c = { ...prev }; delete c[taskId]; return c; });
      }
    });
  };

  const handleTaskReject = (taskId) => {
    if (!taskComments[taskId]?.trim()) {
      toast.warning('Please add review feedback before rejecting.');
      return;
    }
    rejectTaskReview.mutate({ taskid: taskId, comment: taskComments[taskId] }, {
      onSuccess: () => {
        toast.success('Task completion rejected');
        setTaskComments((prev) => { const c = { ...prev }; delete c[taskId]; return c; });
      }
    });
  };

  const handleTaskRevert = (taskId) => {
    undoTaskReview.mutate(taskId, {
      onSuccess: () => {
        toast.success('Task review decision undone');
      }
    });
  };

  const handleTaskCommentChange = (taskId, val) => {
    setTaskComments((prev) => ({ ...prev, [taskId]: val }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUserId('');
    setSelectedProjectId('');
    setShowOnlyOverruns(false);
  };

  const hasActiveFilters = Boolean(searchQuery || selectedUserId || selectedProjectId || showOnlyOverruns);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' , zoom:'var(--page-zoom, 0.9)'}}>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: 'color-mix(in oklch, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={17} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Approvals Center
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              {activeCategoryTab === 'timelogs' ? 'Review and action employee time log submissions' : 'Review and action employee task completion requests'}
            </p>
          </div>
        </div>

        {/* Tab toggle lives in header */}
        <ApprovalTabToggle
          showHistory={showHistory}
          onToggle={setShowHistory}
          pendingCount={activeKpiCounts.pending}
          historyCount={activeKpiCounts.approved + activeKpiCounts.rejected}
        />
      </div>

      {/* Category selector (Time Logs vs Task Reviews) */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveCategoryTab('timelogs')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeCategoryTab === 'timelogs' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeCategoryTab === 'timelogs' ? 'var(--primary)' : 'var(--muted-foreground)',
            padding: '0.5rem 1rem',
            fontSize: '0.825rem',
            fontWeight: 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}
        >
          <Clock size={14} />
          Time Logs
        </button>
        <button
          onClick={() => setActiveCategoryTab('tasks')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeCategoryTab === 'tasks' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeCategoryTab === 'tasks' ? 'var(--primary)' : 'var(--muted-foreground)',
            padding: '0.5rem 1rem',
            fontSize: '0.825rem',
            fontWeight: 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'all 0.15s ease',
          }}
        >
          <CheckSquare size={14} />
          Task Reviews
        </button>
      </div>

      {/* KPI tiles */}
      <ApprovalKpiBar
        pendingCount={activeKpiCounts.pending}
        approvedCount={activeKpiCounts.approved}
        rejectedCount={activeKpiCounts.rejected}
        overrunCount={activeKpiCounts.overruns}
      />

      {/* Filter bar */}
      <ApprovalFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        showOnlyOverruns={showOnlyOverruns}
        onOverrunsChange={setShowOnlyOverruns}
        userOptions={userOptions}
        projectOptions={projectOptions}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
          {showHistory ? 'Decision History' : 'Pending Approval'}
        </span>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: '20px',
            background: 'var(--secondary)',
            color: 'var(--muted-foreground)',
            border: '1px solid var(--border)',
          }}
        >
          {activeCategoryTab === 'timelogs' ? filteredEntries.length : filteredTasks.length}
        </span>
      </div>

      {/* Table */}
      {activeCategoryTab === 'timelogs' ? (
        <ApprovalTable
          entries={filteredEntries}
          showHistory={showHistory}
          users={users}
          tasks={tasks}
          projects={projects}
          comments={comments}
          onCommentChange={handleCommentChange}
          onApprove={handleApprove}
          onReject={handleReject}
          onRevert={handleRevert}
        />
      ) : (
        <ApprovalTaskTable
          tasks={filteredTasks}
          showHistory={showHistory}
          users={users}
          projects={projects}
          comments={taskComments}
          onCommentChange={handleTaskCommentChange}
          onApprove={handleTaskApprove}
          onReject={handleTaskReject}
          onRevert={handleTaskRevert}
        />
      )}
      
    </div>
  );
}