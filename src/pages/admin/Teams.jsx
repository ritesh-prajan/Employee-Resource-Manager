import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';

import DataTable from '../../components/ui/DataTable';
import AvatarGroup from '../../components/ui/AvatarGroup';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchableSelect from '../../components/ui/SearchableSelect';

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

  const [teamFilter, setTeamFilter] = useState('all');
  const [filterProjectBy, setFilterProjectBy] = useState('');
  const [filterEmployeeBy, setFilterEmployeeBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [detailTeam, setDetailTeam] = useState(null);
  const [tasksTeam, setTasksTeam] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isAdmin    = currentUser.role === 'Admin';
  const isLeadRole = currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead';
  const canManage  = isAdmin || isLeadRole;

  const scopedTeams = teams.filter(t => {
    if (isAdmin) {
      if (teamFilter === 'my') return t.leadId === currentUser.id || t.members.includes(currentUser.id);
      return true;
    }
    if (isLeadRole) return t.leadId === currentUser.id || t.members.includes(currentUser.id);
    return t.members.includes(currentUser.id) || t.leadId === currentUser.id;
  });

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
          {isAdmin && (
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem', borderRadius: '6px', color: 'var(--destructive)' }}
              title="Delete Team"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--canvas)', zoom: '0.9' }}>

      <div style={{ borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
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

          {canManage && (
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
      <TaskDetailModal
        isOpen={!!detailTask}
        onClose={() => setDetailTask(null)}
        task={detailTask}
        users={users}
        projects={projects}
      />
      {isAdmin && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteTeam(deleteTarget.id); setDeleteTarget(null); }}
          title="Delete Team"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        />
      )}
    </div>
  );
}