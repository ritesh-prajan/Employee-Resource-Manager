import React, { useState, useMemo } from 'react';
import { FolderPlus, Pencil, Trash2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from '../../components/ui/SearchableSelect';
import DataTable from '../../components/ui/DataTable';
import CreateProjectModal from '../../components/forms/admin/projects/CreateProjectModal';
import EditProjectModal from '../../components/forms/admin/projects/EditProjectModal';
import ProjectDetailModal from '../../components/forms/admin/projects/ProjectDetailModal';

export default function Projects() {
  const {
    currentUser,
    projects,
    tasks,
    users,
    teams,
    deleteProject,
  } = useApp();

  const [filterTeamBy, setFilterTeamBy] = useState('');
  const [filterEmployeeBy, setFilterEmployeeBy] = useState('');
  const [showProjModal, setShowProjModal] = useState(false);
  const [showEditProjModal, setShowEditProjModal] = useState(false);
  const [editingProj, setEditingProj] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAllowedToManage = currentUser?.role === 'Admin' || currentUser?.role === 'Team Lead';

  const baseProjects = projects.filter(p => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') {
      const myLedTeamIds = teams.filter(t => t.leadId === currentUser.id).map(t => t.id);
      return (p.teams || []).some(tId => myLedTeamIds.includes(tId));
    }
    return p.members.includes(currentUser.id);
  });

  const filteredProjects = baseProjects.filter(p => {
  if (filterTeamBy && !(p.teams || []).includes(filterTeamBy)) return false;
  if (filterEmployeeBy && !p.members.includes(filterEmployeeBy)) return false;
  if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
  return true;
});

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'PROJECT NAME',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: row.original.color || '#0010AE' }} />
          <span className="font-semibold text-slate-800">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ getValue }) => {
        const status = getValue() || 'Active';
        const styles = {
          Active: '#0010ae bg-blue-50 text-blue-700',
          Completed: '#16a34a bg-green-50 text-green-700',
          'On Hold': '#ea580c bg-orange-50 text-orange-500',
        };
        return (
          <span className={`rounded-md px-3 py-1 text-xs font-bold ${styles[status] || styles.Active}`}>
            {status.toUpperCase()}
          </span>
        );
      },
    },
    {
      id: 'assignedCount',
      header: 'ASSIGNED COUNT',
      cell: ({ row }) => (
        <span className="text-sm text-slate-700 font-medium">
          {(row.original.members || []).length} members
        </span>
      ),
    },
    {
      id: 'avatars',
      header: 'PROJECT TEAM MEMBERS',
      cell: ({ row }) => {
        const memberIds = row.original.members || [];
        const members = users.filter(u => memberIds.includes(u.id));
        return (
          <div className="flex items-center">
            {members.slice(0, 6).map((m, index) => {
              const parts = m.name.trim().split(/\s+/);
              const initials = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : m.name.substring(0, 2).toUpperCase();
              return (
                <div
                  key={m.id}
                  title={m.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-bold text-blue-700"
                  style={{ marginLeft: index === 0 ? 0 : '-8px' }}
                >
                  {initials}
                </div>
              );
            })}
            {members.length > 6 && (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold text-slate-500"
                style={{ marginLeft: '-8px' }}
              >
                +{members.length - 6}
              </div>
            )}
            {members.length === 0 && <span className="text-xs text-slate-400 italic">No members</span>}
          </div>
        );
      },
    },
    {
      id: 'totalTasks',
      header: 'TOTAL TASKS',
      cell: ({ row }) => {
        const count = tasks.filter(t => t.projectId === row.original.id).length;
        return <span className="font-semibold text-slate-800">{count} tasks</span>;
      },
    },
    ...(isAllowedToManage ? [{
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 text-slate-500"
            onClick={() => { setEditingProj({ ...row.original }); setShowEditProjModal(true); }}
            title="Edit Project"
          >
            <Pencil size={14} />
          </button>
          <button
            className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
            onClick={() => {
              if (window.confirm(`Delete project "${row.original.name}"?`)) {
                deleteProject(row.original.id);
              }
            }}
            title="Delete Project"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    }] : []),
  ], [users, tasks, currentUser]);

  return (
    <div className="min-h-screen  " style={{ zoom: 0.8  }}>
      <div style={{ marginBottom: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.85rem', width: '280px' }}>
              <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--foreground)' }}
              />
            </div>

            <SearchableSelect
              options={teams.map(t => ({ value: t.id, label: t.name }))}
              value={filterTeamBy}
              onChange={setFilterTeamBy}
              placeholder="All Teams"
              style={{ width: '180px' }}
            />

            <SearchableSelect
              options={users.map(u => ({ value: u.id, label: u.name }))}
              value={filterEmployeeBy}
              onChange={setFilterEmployeeBy}
              placeholder="All Members"
              style={{ width: '180px' }}
            />
          </div>

          {isAllowedToManage && (
            <button
              onClick={() => setShowProjModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '0.75rem', padding: '0.6rem 1.5rem' }}
            >
              <FolderPlus size={16} /> New Project
            </button>
          )}
        </div>
      </div>
      <DataTable
        Data={filteredProjects}
        columns={columns}
        onRowClick={(row) => setSelectedProject(row)}
      />
      <CreateProjectModal
        show={showProjModal}
        onClose={() => setShowProjModal(false)}
      />

      <EditProjectModal
        show={showEditProjModal}
        onClose={() => { setShowEditProjModal(false); setEditingProj(null); }}
        project={editingProj}
      />

      <ProjectDetailModal
        show={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
      />

    </div>
  );
}