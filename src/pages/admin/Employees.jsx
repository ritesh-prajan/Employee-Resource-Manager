import React, { useState, useMemo, memo } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from '../../components/ui/SearchableSelect';
import UserAvatar from '../../components/ui/UserAvatar';
import { Plus, ShieldAlert, Eye, EyeOff, CheckSquare, Pencil, Trash } from 'lucide-react';
import MultiSearchSelect from '../../components/ui/MultiSelectDropdown';
import DataTable from '../../components/ui/DataTable';
import AddEmployeeModal from '../../components/forms/AddEmployeeModal';
import EditEmployeeModal from '../../components/forms/EditEmployeeModal';
import AssignTaskModal from '../../components/forms/AssignTaskModal';
import viewProfileModal from '../../components/forms/ViewProfileModal';

export default function EmployeesPage() {
  const { users, projects, teams, tasks, addEmployee, editEmployee, deleteEmployee, currentUser, createTask, editTask } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectBy, setFilterProjectBy] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeForTask, setAssigneeForTask] = useState(null);
  const [showBacklogDropdown, setShowBacklogDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [empData, setEmpData] = useState({
    name: '', employee_code: '', email: '', personalEmail: '',
    phone: '', password: '', designation: '', role: 'Employee', teams: [], projects: []
  });
  const [taskData, setTaskData] = useState({
    name: '', projectId: '', priority: 'Medium', eta: '5', etaDate: '', backlogTaskId: ''
  });
    const [filterTeamBy, setFilterTeamBy] = useState('');
  const getUserTasksCount = (userId) => {
    return tasks.filter(t => t.assignedTo === userId).length;
  };
  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));
const projectOptions = projects.map(p => ({ value: p.id, label: p.name, color: p.color }));

const handleGeneratePasswordForAdd = () => {
  const chars = '0123456789ABCDEF';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * 16)];
  setEmpData(prev => ({ ...prev, password: pass }));
};

const handleGeneratePasswordForEdit = () => {
  const chars = '0123456789ABCDEF';
  let pass = '';
  for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * 16)];
  setEditingUser(prev => ({ ...prev, password: pass }));
};

const handleAddSubmit = (e) => {
  e.preventDefault();
  setValidationError('');
  const empCodeTrimmed = empData.employee_code.trim();
  const emailTrimmed = empData.email.trim();
  const phoneTrimmed = empData.phone.trim();
  if (!empData.name || !empCodeTrimmed || !emailTrimmed || !phoneTrimmed) {
    setValidationError('Please fill in all required fields.'); return;
  }
  if (users.some(u => u.employee_code?.trim().toLowerCase() === empCodeTrimmed.toLowerCase())) {
    setValidationError('Employee number must be unique.'); return;
  }
  if (users.some(u => u.email.trim().toLowerCase() === emailTrimmed.toLowerCase())) {
    setValidationError('Work email must be unique.'); return;
  }
  if (users.some(u => u.phone && u.phone.trim().replace(/\s+/g, '') === phoneTrimmed.replace(/\s+/g, ''))) {
    setValidationError('Phone number must be unique.'); return;
  }
  addEmployee({ name: empData.name, employee_code: empCodeTrimmed, email: emailTrimmed, personalEmail: empData.personalEmail.trim(), phone: phoneTrimmed, password: empData.password, passwordLastUpdated: empData.password ? new Date().toISOString() : '', designation: empData.designation.trim() || 'General', role: empData.role, teams: empData.teams, projects: empData.projects });
  setShowAddModal(false);
  setEmpData({ name: '', employee_code: '', email: '', personalEmail: '', phone: '', password: '', designation: '', role: 'Employee', teams: [], projects: [] });
  setShowPassword(false);
};

const handleEditSubmit = (e) => {
  e.preventDefault();
  setValidationError('');
  const empCodeTrimmed = editingUser.employee_code.trim();
  const emailTrimmed = editingUser.email.trim();
  const phoneTrimmed = editingUser.phone.trim();
  if (!editingUser.name || !empCodeTrimmed || !emailTrimmed || !phoneTrimmed) {
    setValidationError('Please fill in all required fields.'); return;
  }
  if (users.some(u => u.id !== editingUser.id && u.employee_code?.trim().toLowerCase() === empCodeTrimmed.toLowerCase())) {
    setValidationError('Employee number must be unique.'); return;
  }
  if (users.some(u => u.id !== editingUser.id && u.email.trim().toLowerCase() === emailTrimmed.toLowerCase())) {
    setValidationError('Work email must be unique.'); return;
  }
  if (users.some(u => u.id !== editingUser.id && u.phone && u.phone.trim().replace(/\s+/g, '') === phoneTrimmed.replace(/\s+/g, ''))) {
    setValidationError('Phone number must be unique.'); return;
  }
  const oldUser = users.find(u => u.id === editingUser.id);
  editEmployee(editingUser.id, { name: editingUser.name, employee_code: empCodeTrimmed, email: emailTrimmed, personalEmail: editingUser.personalEmail.trim(), phone: phoneTrimmed, password: editingUser.password, passwordLastUpdated: oldUser?.password !== editingUser.password ? new Date().toISOString() : (oldUser?.passwordLastUpdated || ''), designation: editingUser.designation.trim() || 'General', role: editingUser.role, status: editingUser.status, teams: editingUser.teams, projects: editingUser.projects });
  setShowEditModal(false);
  setEditingUser(null);
  setShowEditPassword(false);
};

const handleOpenAssignModal = (user) => {
  setAssigneeForTask(user);
  setTaskData({ name: '', projectId: projects[0]?.id || '', priority: 'Medium', eta: '5', etaDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], backlogTaskId: '' });
  setShowAssignModal(true);
};

const handleAssignTaskSubmit = (e) => {
  e.preventDefault();
  if ((!taskData.name && !taskData.backlogTaskId) || !taskData.projectId) return;
  if (taskData.backlogTaskId) {
    editTask(taskData.backlogTaskId, { assignedTo: assigneeForTask.id });
  } else {
    createTask({ name: taskData.name, projectId: taskData.projectId, assignedTo: assigneeForTask.id, priority: taskData.priority, eta: taskData.eta, etaDate: taskData.etaDate, type: 'Story', epic: 'General' });
  }
  setShowAssignModal(false);
  setAssigneeForTask(null);
  setTaskData({ name: '', projectId: '', priority: 'Medium', eta: '5', etaDate: '', backlogTaskId: '' });
};
  const filteredUsers = users.filter(u => {
    if (filterProjectBy) {
      const isUserInProject = projects.some(p => p.id === filterProjectBy && p.members.includes(u.id));
      if (!isUserInProject) return false;
    }
    if (filterTeamBy) {
      const isUserInTeam = teams.some(
        t => t.id === filterTeamBy && (t.leadId === u.id || t.members.includes(u.id))
      );
      if (!isUserInTeam) return false;
    }

    const designation = u.designation || u.department || '';
    const employeeCode = u.employee_code || '';
    const personalEmail = u.personalEmail || '';
    const phone = u.phone || '';

        return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      personalEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

    const columns = useMemo(() => [
    {
      accessorKey: 'staffMember',
      header: 'STAFF MEMBER',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <UserAvatar name={user.name} size={36} />
            <span
              className="font-semibold text-slate-700 text-sm cursor-pointer hover:text-blue-700 hover:underline"
              onClick={() => { setProfileUser(user); setShowProfileModal(true); }}
            >
              {user.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'employee_code',
      header: 'EMPLOYEE ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-slate-500 whitespace-nowrap">{getValue() || '-'}</span>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'DESIGNATION',
      cell: ({ row }) => (
        <span className="text-sm text-slate-700">{row.original.designation || row.original.department || 'General'}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'WORK EMAIL',
      cell: ({ getValue }) => (
        <a href={`mailto:${getValue()}`} className="text-sm text-blue-700 hover:underline">{getValue()}</a>
      ),
    },
    {
      accessorKey: 'personalEmail',
      header: 'PERSONAL EMAIL',
      cell: ({ getValue }) => {
        const val = getValue() || '-';
        return val !== '-'
          ? <a href={`mailto:${val}`} className="text-sm text-slate-700 hover:underline">{val}</a>
          : <span className="text-sm text-slate-400">-</span>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'PHONE',
      cell: ({ getValue }) => <span className="text-sm text-slate-700 whitespace-nowrap">{getValue() || '-'}</span>,
    },
    {
      accessorKey: 'activeTasks',
      header: 'ACTIVE TASKS',
      cell: ({ row }) => {
        const count = getUserTasksCount(row.original.id);
        return <span className={`text-sm font-semibold ${count > 0 ? 'text-blue-700' : 'text-slate-400'}`}>{count}</span>;
      },
    },
    {
      accessorKey: 'role',
      header: 'ROLE',
      cell: ({ getValue }) => (
        <span className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 whitespace-nowrap">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span className={`text-sm font-semibold ${status === 'Active' ? 'text-emerald-500' : status === 'On Break' ? 'text-amber-500' : 'text-slate-400'}`}>
            {status}
          </span>
        );
      },
    },
    {
      id: 'action',
      header: 'ACTION',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
            <button onClick={() => handleOpenAssignModal(user)} title="Assign Task"
              style={{ background: 'rgba(0,16,174,0.05)', border: 'none', color: '#0010AE', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,16,174,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,16,174,0.05)'}
            ><CheckSquare size={14} /></button>
            {user.id !== currentUser?.id && user.id !== 'user-admin' && (<>
              <button onClick={() => { setEditingUser({ ...user, designation: user.designation || '', personalEmail: user.personalEmail || '', phone: user.phone || '', password: user.password || '', teams: teams.filter(t => t.members.includes(user.id)).map(t => t.id), projects: projects.filter(p => p.members.includes(user.id)).map(p => p.id) }); setValidationError(''); setShowEditModal(true); }} title="Edit"
                style={{ background: 'rgba(96,165,250,0.05)', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.1)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(96,165,250,0.05)'}
              ><Pencil size={14} /></button>
              <button onClick={() => { if (window.confirm(`Remove ${user.name}?`)) deleteEmployee(user.id); }} title="Delete"
                style={{ background: 'rgba(239,68,68,0.05)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'}
              ><Trash size={14} /></button>
            </>)}
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="min-h-screen bg-slate-100 p-8 " style={{ zoom: 0.8 }}>
      <div className="mx-auto">

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  backgroundColor: 'var(--bg-canvas, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '0.5rem 0.85rem',
                  width: '280px',
                }}
              >
                <Search size={16} style={{ color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary, #1e293b)',
                  }}
                />
              </div>

              {/* Project Filter */}
              <SearchableSelect
                options={projectOptions}
                value={filterProjectBy}
                onChange={setFilterProjectBy}
                placeholder="All Projects"
                style={{ width: '180px' }}
              />

              {/* Team Filter */}
              <SearchableSelect
                options={teamOptions}
                value={filterTeamBy}
                onChange={setFilterTeamBy}
                placeholder="All Teams"
                style={{ width: '180px' }}
              />
            </div>

            <button
              onClick={() => { setValidationError(''); setShowAddModal(true); }}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Staff Member
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable Data={filteredUsers} columns={columns} />
      </div>
      {/*ADD EMPLOYEE*/}
      <AddEmployeeModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        users={users}
        teams={teams}
        projects={projects}
        onSubmit={addEmployee}
      />
      {/* MODAL: EDIT EMPLOYEE */}
      <EditEmployeeModal
        show={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingUser(null); }}
        user={editingUser}
        users={users}
        teams={teams}
        projects={projects}
        onSubmit={editEmployee}
      />

      {/* MODAL: QUICK ASSIGN TASK */}
      <AssignTaskModal
        show={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssigneeForTask(null); }}
        assignee={assigneeForTask}
        tasks={tasks}
        projects={projects}
        onSubmit={createTask}
        onAssignExisting={editTask}
      />
      {/*View Profile on Click*/}
      <ViewProfileModal
        show={showProfileModal}
        onClose={() => { setShowProfileModal(false); setProfileUser(null); }}
        user={profileUser}
        teams={teams}
        projects={projects}
        getUserTasksCount={getUserTasksCount}
      />
    </div>
  );
}