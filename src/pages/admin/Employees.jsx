import React, { useState, useMemo, memo } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from '../../components/ui/SearchableSelect';
import UserAvatar from '../../components/ui/UserAvatar';
import { Plus, ShieldAlert, Eye, EyeOff, CheckSquare, Pencil, Trash } from 'lucide-react';
import MultiSearchSelect from '../../components/ui/MultiSelectDropdown';
import DataTable from '../../components/ui/DataTable';

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
    {/* MODAL: ADD EMPLOYEE */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Staff Member</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {validationError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger, #ef4444)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500 }}>
                  <ShieldAlert size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">FULL NAME *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. David Miller"
                    value={empData.name}
                    onChange={(e) => setEmpData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">EMPLOYEE NUMBER *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. EMP-0046"
                    value={empData.employee_code}
                    onChange={(e) => setEmpData(prev => ({ ...prev, employee_code: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">WORK EMAIL *</label>
                  <input 
                    type="email" 
                    className="input-control"
                    placeholder="E.g. david.m@office.com"
                    value={empData.email}
                    onChange={(e) => setEmpData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PERSONAL EMAIL (OPTIONAL)</label>
                  <input 
                    type="email" 
                    className="input-control"
                    placeholder="E.g. david.m.personal@gmail.com"
                    value={empData.personalEmail}
                    onChange={(e) => setEmpData(prev => ({ ...prev, personalEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">PHONE NUMBER *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. +91 99999 88888"
                    value={empData.phone}
                    onChange={(e) => setEmpData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">DESIGNATION *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. Senior Software Engineer"
                    value={empData.designation}
                    onChange={(e) => setEmpData(prev => ({ ...prev, designation: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ORGANIZATIONAL ROLE</label>
                  <select 
                    className="input-control"
                    value={empData.role}
                    onChange={(e) => setEmpData(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="input-control"
                        placeholder="Enter or generate password"
                        value={empData.password}
                        onChange={(e) => setEmpData(prev => ({ ...prev, password: e.target.value }))}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={handleGeneratePasswordForAdd}
                      style={{ whiteSpace: 'nowrap', padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ASSIGN TEAMS</label>
                  <MultiSearchSelect 
                    options={teamOptions} 
                    selectedValues={empData.teams} 
                    onChange={(vals) => setEmpData(prev => ({ ...prev, teams: vals }))} 
                    placeholder="Select teams..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ASSIGN PROJECTS</label>
                  <MultiSearchSelect 
                    options={projectOptions} 
                    selectedValues={empData.projects} 
                    onChange={(vals) => setEmpData(prev => ({ ...prev, projects: vals }))} 
                    placeholder="Select projects..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0010AE', color: '#ffffff' }}>Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EMPLOYEE */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Staff Member</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>×</button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {validationError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger, #ef4444)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500 }}>
                  <ShieldAlert size={16} />
                  <span>{validationError}</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">FULL NAME *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. David Miller"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">EMPLOYEE NUMBER *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. EMP-0046"
                    value={editingUser.employee_code || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, employee_code: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">WORK EMAIL *</label>
                  <input 
                    type="email" 
                    className="input-control"
                    placeholder="E.g. david.m@office.com"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PERSONAL EMAIL (OPTIONAL)</label>
                  <input 
                    type="email" 
                    className="input-control"
                    placeholder="E.g. david.m.personal@gmail.com"
                    value={editingUser.personalEmail || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, personalEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">PHONE NUMBER *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. +91 99999 88888"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">DESIGNATION *</label>
                  <input 
                    type="text" 
                    className="input-control"
                    placeholder="E.g. Senior Software Engineer"
                    value={editingUser.designation || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, designation: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ORGANIZATIONAL ROLE</label>
                  <select 
                    className="input-control"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="Employee">Employee (Developer/Designer)</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">STATUS</label>
                  <select 
                    className="input-control"
                    value={editingUser.status}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="On Break">On Break</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input 
                        type={showEditPassword ? "text" : "password"} 
                        className="input-control"
                        placeholder="Enter or generate password"
                        value={editingUser.password || ''}
                        onChange={(e) => setEditingUser(prev => ({ ...prev, password: e.target.value }))}
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={handleGeneratePasswordForEdit}
                      style={{ whiteSpace: 'nowrap', padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">PASSWORD LAST UPDATED</label>
                  <div 
                    style={{ 
                      padding: '6px 12px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px', 
                      backgroundColor: 'var(--bg-canvas, #f6f6f6)', 
                      fontSize: '0.82rem', 
                      color: 'var(--text-secondary)',
                      minHeight: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box'
                    }}
                  >
                    {editingUser.passwordLastUpdated ? new Date(editingUser.passwordLastUpdated).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ASSIGN TEAMS</label>
                  <MultiSearchSelect 
                    options={teamOptions} 
                    selectedValues={editingUser.teams || []} 
                    onChange={(vals) => setEditingUser(prev => ({ ...prev, teams: vals }))} 
                    placeholder="Select teams..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ASSIGN PROJECTS</label>
                  <MultiSearchSelect 
                    options={projectOptions} 
                    selectedValues={editingUser.projects || []} 
                    onChange={(vals) => setEditingUser(prev => ({ ...prev, projects: vals }))} 
                    placeholder="Select projects..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0010AE', color: '#ffffff' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK ASSIGN TASK */}
      {showAssignModal && assigneeForTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Task to {assigneeForTask.name}</h3>
              <button className="modal-close" onClick={() => { setShowAssignModal(false); setAssigneeForTask(null); }}>×</button>
            </div>
            
            <form onSubmit={handleAssignTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">TASK NAME *</label>
                <input 
                  type="text" 
                  className="input-control"
                  placeholder="E.g. Setup database migration scripts"
                  value={taskData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTaskData(prev => {
                      const allBacklogs = tasks.filter(t => !t.assignedTo || t.assignedTo === '');
                      const exactMatch = allBacklogs.find(t => t.taskNumber.toLowerCase() === val.trim().toLowerCase());
                      return {
                        ...prev,
                        name: val,
                        backlogTaskId: exactMatch ? exactMatch.id : ''
                      };
                    });
                    setShowBacklogDropdown(true);
                  }}
                  onFocus={() => setShowBacklogDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBacklogDropdown(false), 200)}
                  required
                />
                {showBacklogDropdown && (
                  (() => {
                    const allBacklogs = tasks.filter(t => !t.assignedTo || t.assignedTo === '');
                    const matchingBacklogs = taskData.name.trim().length >= 1 ? allBacklogs.filter(t => 
                      t.name.toLowerCase().includes(taskData.name.toLowerCase()) || 
                      t.taskNumber.toLowerCase().includes(taskData.name.toLowerCase())
                    ) : [];

                    if (matchingBacklogs.length === 0) return null;

                    return (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        maxHeight: '150px',
                        overflowY: 'auto',
                        marginTop: '2px'
                      }}>
                        {matchingBacklogs.map(t => {
                          const proj = projects.find(p => p.id === t.projectId);
                          return (
                            <div
                              key={t.id}
                              onClick={() => {
                                setTaskData(prev => ({
                                  ...prev,
                                  backlogTaskId: t.id,
                                  name: `${t.taskNumber}: ${t.name}`,
                                  projectId: t.projectId,
                                  priority: t.priority,
                                  eta: t.eta.toString()
                                }));
                                setShowBacklogDropdown(false);
                              }}
                              style={{
                                padding: '8px 12px',
                                borderBottom: '1px solid var(--border-color)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.name}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.taskNumber} • {proj ? proj.name.split(' (')[0] : 'Project'}</span>
                              </div>
                              <span style={{ fontSize: '0.65rem', color: '#32bf90', fontWeight: 600 }}>Backlog</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">PROJECT *</label>
                  <select 
                    className="input-control"
                    value={taskData.projectId}
                    onChange={(e) => setTaskData(prev => ({ ...prev, projectId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">PRIORITY</label>
                  <select 
                    className="input-control"
                    value={taskData.priority}
                    onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ESTIMATED HOURS (ETA) *</label>
                  <input 
                    type="number" 
                    className="input-control"
                    min="1"
                    value={taskData.eta}
                    onChange={(e) => setTaskData(prev => ({ ...prev, eta: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ETA DATE *</label>
                  <input 
                    type="date" 
                    className="input-control"
                    value={taskData.etaDate}
                    onChange={(e) => setTaskData(prev => ({ ...prev, etaDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
                    
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAssignModal(false); setAssigneeForTask(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0010AE', color: '#ffffff' }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/*View Profile on Click*/}
      {showProfileModal && profileUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Employee Profile</h3>
              <button className="modal-close" onClick={() => { setShowProfileModal(false); setProfileUser(null); }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <UserAvatar name={profileUser.name} size={52} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{profileUser.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{profileUser.designation || profileUser.department || 'General'}</div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#475569' }}>{profileUser.role}</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: profileUser.status === 'Active' ? '#10b981' : profileUser.status === 'On Break' ? '#f59e0b' : '#94a3b8' }}>
                    ● {profileUser.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'EMPLOYEE ID', value: profileUser.employee_code || '-' },
                  { label: 'PHONE', value: profileUser.phone || '-' },
                  { label: 'WORK EMAIL', value: profileUser.email },
                  { label: 'PERSONAL EMAIL', value: profileUser.personalEmail || '-' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Teams */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>TEAMS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {teams.filter(t => t.members.includes(profileUser.id) || t.leadId === profileUser.id).length === 0
                    ? <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not assigned to any team</span>
                    : teams.filter(t => t.members.includes(profileUser.id) || t.leadId === profileUser.id).map(t => (
                      <span key={t.id} style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e6e8ff', color: '#0010AE', padding: '3px 10px', borderRadius: '6px' }}>
                        {t.name} {t.leadId === profileUser.id ? '(Lead)' : ''}
                      </span>
                    ))
                  }
                </div>
              </div>

              {/* Projects */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>PROJECTS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {projects.filter(p => p.members.includes(profileUser.id)).length === 0
                    ? <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not assigned to any project</span>
                    : projects.filter(p => p.members.includes(profileUser.id)).map(p => (
                      <span key={p.id} style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.color + '22', color: p.color, padding: '3px 10px', borderRadius: '6px', border: `1px solid ${p.color}44` }}>
                        {p.name.split(' (')[0]}
                      </span>
                    ))
                  }
                </div>
              </div>

              {/* Active Tasks Count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Active Tasks</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0010AE' }}>{getUserTasksCount(profileUser.id)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button className="btn btn-secondary" onClick={() => { setShowProfileModal(false); setProfileUser(null); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
        )}
    </div>
  );
}