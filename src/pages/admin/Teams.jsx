  import React, { useState } from 'react';
  import { Plus, Pencil, Trash2, Search} from 'lucide-react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { useApp } from '../../context/AppContext';

  // UI primitives
  import DataTable from '../../components/ui/DataTable';
  import AvatarGroup from '../../components/ui/AvatarGroup';
  import ConfirmDialog from '../../components/ui/ConfirmDialog';
  import SearchableSelect from '../../components/ui/SearchableSelect';

  // Team modals
  import CreateTeamModal from '../../components/forms/admin/teams/CreateTeamModal';
  import EditTeamModal from '../../components/forms/admin/teams/EditTeamModal';
  import TeamsDetailsModal from '../../components/forms/admin/teams/TeamsDetailsModal';
  import TeamTasksModal from '../../components/forms/admin/teams/Teamtasksmodal';
  import TaskDetailModal from '../../components/forms/admin/teams/TaskDetailModal';

  export default function Teams() {
    const {
      currentUser,
      users,
      projects,
      tasks,
      teams,
      createTeam,
      editTeam,
      deleteTeam,
      createTask,
    } = useApp();

    // ── Filter state ────────────────────────────────────────────
    const [teamFilter, setTeamFilter]         = useState('all'); // 'all' | 'my'
    const [filterProjectBy, setFilterProjectBy] = useState('');
    const [filterEmployeeBy, setFilterEmployeeBy] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // ── Modal state ────────────────────────────────────────────
    const [showCreate, setShowCreate]         = useState(false);
    const [showEdit, setShowEdit]             = useState(false);
    const [editingTeam, setEditingTeam]       = useState(null);
    const [detailTeam, setDetailTeam]         = useState(null);   // row click → TeamDetailsModal
    const [tasksTeam, setTasksTeam]           = useState(null);   // lead "View Tasks" click
    const [detailTask, setDetailTask]         = useState(null);   // task row click → TaskDetailModal
    const [deleteTarget, setDeleteTarget]     = useState(null);   // team to delete → ConfirmDialog
    
    // ── Role helpers ───────────────────────────────────────────
    const isAdmin    = currentUser.role === 'Admin';
    const isLeadRole = currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead';
    const canManage  = isAdmin || isLeadRole;

    // ── Filter logic ───────────────────────────────────────────
    // 1. Scope: admin sees all or "my"; leads see only their own teams
    const scopedTeams = teams.filter(t => {
      if (isAdmin) {
        if (teamFilter === 'my') return t.leadId === currentUser.id || t.members.includes(currentUser.id);
        return true;
      }
      if (isLeadRole) return t.leadId === currentUser.id;
      // Regular employee — only teams they're in
      return t.members.includes(currentUser.id) || t.leadId === currentUser.id;
    });

    // 2. Project filter — team must be linked to the selected project
    // 3. Employee filter — team lead or member must match
    const filteredTeams = scopedTeams.filter(t => {
    if (filterProjectBy) {
      const linked = projects.some(p => p.id === filterProjectBy && (p.teams || []).includes(t.id));
      if (!linked) return false;
    }
    if (filterEmployeeBy) {
      if (t.leadId !== filterEmployeeBy && !t.members.includes(filterEmployeeBy)) return false;
    }
    if (searchQuery) {
      if (!t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

    // ── DataTable columns ──────────────────────────────────────
    // We define columns here because they reference local state setters
    const columns = [
      {
        accessorKey: 'name',
        header: 'TEAM NAME',
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>{getValue()}</span>
        ),
      },
      {
        id: 'lead',
        header: 'TEAM LEAD',
        cell: ({ row }) => {
          const lead = users.find(u => u.id === row.original.leadId);
          if (!lead) return <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>—</span>;
          const initials = (() => {
            const parts = lead.name.trim().split(/\s+/);
            return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
          })();
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="user-initials-badge" style={{ width: 26, height: 26, fontSize: '0.62rem', flexShrink: 0 }}>{initials}</div>
              <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{lead.name}</span>
            </div>
          );
        },
      },
      {
        id: 'memberCount',
        header: 'MEMBERS',
        cell: ({ row }) => (
          <span style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            {users.filter(u => row.original.members.includes(u.id)).length} members
          </span>
        ),
      },
      {
        id: 'avatars',
        header: 'TEAM MEMBERS',
        cell: ({ row }) => {
          const memberUsers = users.filter(u => row.original.members.includes(u.id));
          return <AvatarGroup users={memberUsers} max={6} size={36} />;
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'CREATED',
        cell: ({ getValue }) => (
          <span style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>
            {new Date(getValue()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        ),
      },
      ...(canManage ? [{
        id: 'actions',
        header: 'ACTIONS',
        cell: ({ row }) => (
          <div style={{ display: 'inline-flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--primary)' }}
              title="Edit Team"
              onClick={() => { setEditingTeam({ ...row.original }); setShowEdit(true); }}
            >
              <Pencil size={13} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--destructive)' }}
              title="Delete Team"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      }] : []),
    ];

    // ── Lead-role simple table (no DataTable pagination needed) ─
    // Lead teams are usually 1–2 so pagination would be overkill.
    // We keep the table structure but render inline.
    if (isLeadRole) {
     const leadTeams = teams.filter(t => {
        if (!(t.leadId === currentUser.id || t.members.includes(currentUser.id))) return false;
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem',backgroundColor:'var(--canvas)' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Team Name', 'Team Lead', 'Members', 'Members (click to edit)', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadTeams.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                      You are not part of any teams.
                    </td>
                  </tr>
                )}
                {leadTeams.map(team => {
                  const lead = users.find(u => u.id === team.leadId);
                  const memberUsers = users.filter(u => team.members.includes(u.id));
                  return (
                    <tr key={team.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Clickable team name → opens TeamTasksModal */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <button
                          onClick={() => setTasksTeam(team)}
                          style={{ background: 'none', border: 'none', fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          {team.name}
                        </button>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                        {lead?.name || '—'}
                      </td>
                      <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--foreground)' }}>
                        {memberUsers.length} members
                      </td>
                      {/* Clicking the badge cluster opens EditTeamModal */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div
                          onClick={() => { setEditingTeam({ ...team }); setShowEdit(true); }}
                          title="Click to manage team members"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '5px 8px', borderRadius: '8px', cursor: 'pointer',
                            border: '1px dashed var(--border)', backgroundColor: 'var(--secondary)',
                          }}
                        >
                          <AvatarGroup users={memberUsers} max={6} size={24} />
                          {memberUsers.length === 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No members</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => setTasksTeam(team)}
                          style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        >
                          View Tasks
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modals for lead view */}
          <TeamTasksModal
            isOpen={!!tasksTeam}
            onClose={() => setTasksTeam(null)}
            team={tasksTeam}
            users={users}
            tasks={tasks}
            projects={projects}
            onCreateTask={createTask}
            onSelectTask={(t) => setDetailTask(t)}
          />
          <EditTeamModal
            isOpen={showEdit}
            onClose={() => { setShowEdit(false); setEditingTeam(null); }}
            team={editingTeam}
            users={users}
            onSave={(id, data) => { editTeam(id, data); setShowEdit(false); setEditingTeam(null); }}
          />
          <TaskDetailModal
            isOpen={!!detailTask}
            onClose={() => setDetailTask(null)}
            task={detailTask}
            users={users}
            projects={projects}
          />
        </div>
      );
    }

    // ── Admin / Employee view ──────────────────────────────────
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem',backgroundColor:'var(--canvas)' ,zoom:'0.8'}}>

        {/* Page header + controls */}
          <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>

              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.85rem', width: '280px' }}>
                <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--foreground)' }}
                />
              </div>
              <SearchableSelect
                options={projects.map(p => ({ value: p.id, label: p.name.split(' (')[0] }))}
                value={filterProjectBy}
                onChange={setFilterProjectBy}
                placeholder="All Projects"
                style={{ width: '180px' }}
              />

              <SearchableSelect
                options={users.map(u => ({ value: u.id, label: u.name }))}
                value={filterEmployeeBy}
                onChange={setFilterEmployeeBy}
                placeholder="All Employees"
                style={{ width: '180px' }}
              />
              {/* All / My toggle — admin only */}
              {isAdmin && (
                <div style={{ display: 'inline-flex', backgroundColor: 'var(--secondary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  {['all', 'my'].map(v => (
                    <button
                      key={v}
                      onClick={() => setTeamFilter(v)}
                      style={{
                        padding: '0.3rem 0.85rem', fontSize: '0.72rem', fontWeight: 600,
                        borderRadius: '6px', border: 'none', cursor: 'pointer',
                        backgroundColor: teamFilter === v ? 'var(--primary)' : 'transparent',
                        color: teamFilter === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {v === 'all' ? 'All Teams' : 'My Teams'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreate(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '0.75rem', padding: '0.6rem 1.5rem' }}
              >
                <Plus size={16} /> Create Team
              </button>
            )}
          </div>
        </div>

        {/* Main table */}
        <AnimatePresence mode="wait">
          <motion.div
            key="teams-table"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <DataTable
              Data={filteredTeams}
              columns={columns}
              onRowClick={(team) => setDetailTeam(team)}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── Modals ── */}
        <CreateTeamModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          users={users}
          onSubmit={(data) => { createTeam(data); setShowCreate(false); }}
        />

        <EditTeamModal
          isOpen={showEdit}
          onClose={() => { setShowEdit(false); setEditingTeam(null); }}
          team={editingTeam}
          users={users}
          onSave={(id, data) => { editTeam(id, data); setShowEdit(false); setEditingTeam(null); }}
        />

        <TeamsDetailsModal
          isOpen={!!detailTeam}
          onClose={() => setDetailTeam(null)}
          team={detailTeam}
          users={users}
          tasks={tasks}
        />

        <TaskDetailModal
          isOpen={!!detailTask}
          onClose={() => setDetailTask(null)}
          task={detailTask}
          users={users}
          projects={projects}
        />

        {/* ConfirmDialog replaces window.confirm for delete */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteTeam(deleteTarget.id); setDeleteTarget(null); }}
          title="Delete Team"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        />
      </div>
    );
  }