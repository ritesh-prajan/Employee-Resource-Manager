import React, { useState, useMemo } from 'react';
import { Search, Plus, CheckSquare, Pencil, Trash } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from '../../components/ui/SearchableSelect';
import UserAvatar from '../../components/ui/UserAvatar';
import MultiSearchSelect from '../../components/ui/MultiSelectDropdown';
import DataTable from '../../components/ui/DataTable';
import AddEmployeeModal from '../../components/forms/admin/employee/AddEmployeeModal';
import EditEmployeeModal from '../../components/forms/admin/employee/EditEmployeeModal';
import AssignTaskModal from '../../components/forms/admin/employee/AssignTaskModal';
import ViewProfileModal from '../../components/forms/admin/employee/ViewProfileModal';

export default function EmployeesPage() {
  const { users, projects, teams, tasks, addEmployee, editEmployee, deleteEmployee, currentUser, createTask, editTask } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectBy, setFilterProjectBy] = useState('');
  const [filterTeamBy, setFilterTeamBy] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeForTask, setAssigneeForTask] = useState(null);
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

  const getUserTasksCount = (userId) => tasks.filter(t => t.assignedTo === userId).length;

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
      const isUserInTeam = teams.some(t => t.id === filterTeamBy && (t.leadId === u.id || t.members.includes(u.id)));
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserAvatar name={user.name} size={36} />
            <span
              style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.textDecoration = 'none'; }}
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
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{getValue() || '-'}</span>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'DESIGNATION',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>{row.original.designation || row.original.department || 'General'}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'WORK EMAIL',
      cell: ({ getValue }) => (
        <a href={`mailto:${getValue()}`} style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >{getValue()}</a>
      ),
    },
    {
      accessorKey: 'personalEmail',
      header: 'PERSONAL EMAIL',
      cell: ({ getValue }) => {
        const val = getValue() || '-';
        return val !== '-'
          ? <a href={`mailto:${val}`} style={{ fontSize: '0.875rem', color: 'var(--foreground)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >{val}</a>
          : <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>-</span>;
      },
    },
    {
      accessorKey: 'phone',
      header: 'PHONE',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>{getValue() || '-'}</span>
      ),
    },
    {
      accessorKey: 'activeTasks',
      header: 'ACTIVE TASKS',
      cell: ({ row }) => {
        const count = getUserTasksCount(row.original.id);
        return (
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: count > 0 ? 'var(--primary)' : 'var(--muted-foreground)' }}>{count}</span>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'ROLE',
      cell: ({ getValue }) => (
        <span style={{ borderRadius: '6px', backgroundColor: 'var(--muted)', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{getValue()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ getValue }) => {
        const status = getValue();
        const color = status === 'Active' ? '#22c55e' : status === 'On Break' ? '#f59e0b' : 'var(--muted-foreground)';
        return <span style={{ fontSize: '0.875rem', fontWeight: 600, color }}>{status}</span>;
      },
    },
    {
      id: 'action',
      header: 'ACTION',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
            <button
              onClick={() => handleOpenAssignModal(user)}
              title="Assign Task"
              style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
              onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 15%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 8%, transparent)'}
            ><CheckSquare size={14} /></button>

            {user.id !== currentUser?.id && user.id !== 'user-admin' && (<>
              <button
                onClick={() => { setEditingUser({ ...user, designation: user.designation || '', personalEmail: user.personalEmail || '', phone: user.phone || '', password: user.password || '', teams: teams.filter(t => t.members.includes(user.id)).map(t => t.id), projects: projects.filter(p => p.members.includes(user.id)).map(p => p.id) }); setValidationError(''); setShowEditModal(true); }}
                title="Edit"
                style={{ background: 'color-mix(in oklch, var(--chart-1) 8%, transparent)', border: 'none', color: 'var(--chart-1)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--chart-1) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--chart-1) 8%, transparent)'}
              ><Pencil size={14} /></button>

              <button
                onClick={() => { if (window.confirm(`Remove ${user.name}?`)) deleteEmployee(user.id); }}
                title="Delete"
                style={{ background: 'color-mix(in oklch, var(--destructive) 8%, transparent)', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--destructive) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--destructive) 8%, transparent)'}
              ><Trash size={14} /></button>
            </>)}
          </div>
        );
      },
    },
  ], []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--canvas)', padding: '2rem', zoom: 0.8 }}>
      <div>
        {/* Toolbar */}
        <div style={{ marginBottom: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', backgroundColor: 'var(--card)', padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--background)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 0.85rem', width: '280px' }}>
                <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', color: 'var(--foreground)' }}
                />
              </div>

              <SearchableSelect options={projectOptions} value={filterProjectBy} onChange={setFilterProjectBy} placeholder="All Projects" style={{ width: '180px' }} />
              <SearchableSelect options={teamOptions} value={filterTeamBy} onChange={setFilterTeamBy} placeholder="All Teams" style={{ width: '180px' }} />
            </div>

            <button
              onClick={() => { setValidationError(''); setShowAddModal(true); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '0.75rem', padding: '0.6rem 1.5rem' }}
            >
              <Plus size={16} /> Add Staff Member
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable Data={filteredUsers} columns={columns} />
      </div>

      <AddEmployeeModal show={showAddModal} onClose={() => setShowAddModal(false)} users={users} teams={teams} projects={projects} onSubmit={addEmployee} />
      <EditEmployeeModal show={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null); }} user={editingUser} users={users} teams={teams} projects={projects} onSubmit={editEmployee} />
      <AssignTaskModal show={showAssignModal} onClose={() => { setShowAssignModal(false); setAssigneeForTask(null); }} assignee={assigneeForTask} tasks={tasks} projects={projects} onSubmit={createTask} onAssignExisting={editTask} />
      <ViewProfileModal show={showProfileModal} onClose={() => { setShowProfileModal(false); setProfileUser(null); }} user={profileUser} teams={teams} projects={projects} getUserTasksCount={getUserTasksCount} />
    </div>
  );
}