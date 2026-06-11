// pages/admin/Approvals.jsx
import React, { useState, useMemo } from 'react';
import { UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

import ApprovalKpiBar      from '../../components/approvals/ApprovalKpiBar';
import ApprovalTabToggle   from '../../components/approvals/ApprovalTabToggle';
import ApprovalFilterBar   from '../../components/approvals/ApprovalFilterBar';
import ApprovalTable       from '../../components/approvals/ApprovalTable';

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

  const isAdmin = currentUser?.role === 'Admin';

  // Team lead scope — members of teams this user leads
  const ledMemberIds = useMemo(() => {
    if (isAdmin) return null; // null = no scope restriction
    const ledTeams = teams.filter((t) => t.leadId === currentUser?.id);
    return new Set(ledTeams.flatMap((t) => t.members));
  }, [isAdmin, teams, currentUser]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showHistory,        setShowHistory]        = useState(false);
  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedUserId,     setSelectedUserId]     = useState('');
  const [selectedProjectId,  setSelectedProjectId]  = useState('');
  const [showOnlyOverruns,   setShowOnlyOverruns]   = useState(false);
  const [comments,           setComments]           = useState({}); // { [entryId]: string }

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

  // ── Filter dropdown options ───────────────────────────────────────────────
  const userOptions = useMemo(
    () => users.filter((u) => isAdmin || ledMemberIds?.has(u.id)),
    [users, isAdmin, ledMemberIds]
  );

  const projectOptions = useMemo(() => {
    if (isAdmin) return projects;
    const myTeamIds = teams.filter((t) => t.leadId === currentUser?.id).map((t) => t.id);
    return projects.filter((p) => (p.teams || []).some((tid) => myTeamIds.includes(tid)));
  }, [projects, isAdmin, teams, currentUser]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleApprove = (entryId) => {
    updateEntryStatus(entryId, 'Approved', comments[entryId] || '');
    setComments((prev) => { const c = { ...prev }; delete c[entryId]; return c; });
  };

  const handleReject = (entryId) => {
    if (!comments[entryId]?.trim()) {
      alert('Please add feedback before rejecting.');
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

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedUserId('');
    setSelectedProjectId('');
    setShowOnlyOverruns(false);
  };

  const hasActiveFilters = Boolean(searchQuery || selectedUserId || selectedProjectId || showOnlyOverruns);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' , zoom:'0.8'}}>

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
              Review and action employee time log submissions
            </p>
          </div>
        </div>

        {/* Tab toggle lives in header */}
        <ApprovalTabToggle
          showHistory={showHistory}
          onToggle={setShowHistory}
          pendingCount={kpiCounts.pending}
          historyCount={kpiCounts.approved + kpiCounts.rejected}
        />
      </div>

      {/* KPI tiles */}
      <ApprovalKpiBar
        pendingCount={kpiCounts.pending}
        approvedCount={kpiCounts.approved}
        rejectedCount={kpiCounts.rejected}
        overrunCount={kpiCounts.overruns}
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
          {filteredEntries.length}
        </span>
      </div>

      {/* Table */}
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
      
    </div>
  );
}