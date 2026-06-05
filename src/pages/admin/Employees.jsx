import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import SearchableSelect from '../../components/ui/SearchableSelect';
import UserAvatar from '../../components/ui/UserAvatar';

export default function EmployeesPage() {
  const { users, projects, teams, tasks } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectBy, setFilterProjectBy] = useState('');
  const [filterTeamBy, setFilterTeamBy] = useState('');

  const projectOptions = projects.map(p => ({ value: p.id, label: p.name.split(' (')[0] }));
  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));

  const getUserTasksCount = (userId) => {
    return tasks.filter(t => t.assignedTo === userId).length;
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

  return (
    <div className="min-h-screen bg-slate-100 p-8">
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

            <button className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800">
              + Add Staff Member
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: '1000px' }}>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Staff Member</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Employee ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Designation</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Work Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Personal Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Phone</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-700">Active Tasks</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-700">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center text-sm text-slate-400"
                    >
                      No staff members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const taskCount = getUserTasksCount(user.id);
                    const designation = user.designation || user.department || 'General';
                    const employeeCode = user.employee_code || '-';
                    const personalEmail = user.personalEmail || '-';
                    const phone = user.phone || '-';

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        {/* Staff Member */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={user.name} size={36} />
                            <span className="font-semibold text-slate-700 text-sm">{user.name}</span>
                          </div>
                        </td>

                        {/* Employee ID */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-500">{employeeCode}</span>
                        </td>

                        {/* Designation */}
                        <td className="px-6 py-4 text-sm text-slate-700">{designation}</td>

                        {/* Work Email */}
                         <td className="px-6 py-4">
                          <a href={`mailto:${user.email}`} className="text-sm text-blue-700 hover:underline">
                            {user.email}
                          </a>
                        </td>

                        {/* Personal Email */}
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {personalEmail !== '-' ? (
                            <a href={`mailto:${personalEmail}`} className="text-slate-700 hover:underline">
                              {personalEmail}
                            </a>
                          ) : '-'}
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{phone}</td>

                        {/* Active Tasks */}
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-semibold ${taskCount > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                            {taskCount}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm font-semibold ${
                              user.status === 'Active'
                                ? 'text-emerald-500'
                                : user.status === 'On Break'
                                ? 'text-amber-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-center">
                          <button className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition">
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}