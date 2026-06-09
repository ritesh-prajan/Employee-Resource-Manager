import React, { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import StatusBadge from '../../../ui/StatusBadge';
import PriorityBadge from '../../../ui/PriorityBadge';

/**
 * TeamTasksModal
 * Shown when a Team Lead clicks "View Tasks" on a team row.
 * Props:
 *   isOpen      — bool
 *   onClose     — fn
 *   team        — team object
 *   users       — full users array
 *   tasks       — full tasks array
 *   projects    — full projects array
 *   onCreateTask — fn(taskData) — calls AppContext createTask
 *   onSelectTask — fn(task) — opens TaskDetailModal
 */
export default function TeamTasksModal({ isOpen, onClose, team, users = [], tasks = [], projects = [], onCreateTask, onSelectTask }) {
  const [form, setForm] = useState({ name: '', projectId: '', assignedTo: '', priority: 'Medium', eta: '8' });

  // When team changes, reset form defaults to first available project/member
  useEffect(() => {
    if (!team) return;
    const teamProjects = projects.filter(p => (p.teams || []).includes(team.id));
    const dropdownProjects = teamProjects.length > 0 ? teamProjects : projects;
    const teamMembers = users.filter(u => team.members.includes(u.id));
    setForm({
      name: '',
      projectId: dropdownProjects[0]?.id || '',
      assignedTo: teamMembers[0]?.id || '',
      priority: 'Medium',
      eta: '8',
    });
  }, [team]);

  if (!isOpen || !team) return null;

  const teamProjects = projects.filter(p => (p.teams || []).includes(team.id));
  const dropdownProjects = teamProjects.length > 0 ? teamProjects : projects;
  const teamMembers = users.filter(u => team.members.includes(u.id));
  // Tasks assigned to any member of this team
  const teamTasks = tasks.filter(t => team.members.includes(t.assignedTo));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.assignedTo || !form.projectId) {
      alert('Please fill in all task fields.');
      return;
    }
    onCreateTask({
      name: form.name.trim(),
      projectId: form.projectId,
      assignedTo: form.assignedTo,
      priority: form.priority,
      eta: parseFloat(form.eta) || 8,
      type: 'Story',
      epic: 'Sprint',
    });
    setForm(prev => ({ ...prev, name: '', eta: '8' }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="850px">
      {/* Header */}
      <div className="modal-header" style={{ borderBottom: '3px solid var(--primary)' }}>
        <div>
          <h3 className="modal-title">Tasks — {team.name}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            Assign new tasks and track existing work for this team
          </span>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '1.25rem' }}>

        {/* ── Quick Add Task Form ── */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex', flexDirection: 'column', gap: '0.85rem',
            padding: '1rem', borderRadius: '10px',
            backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>Add New Task</span>

          <div className="form-group">
            <label className="form-label">TASK NAME</label>
            <input
              type="text"
              className="input-control"
              placeholder="Describe the work..."
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">PROJECT</label>
              <select
                className="input-control"
                value={form.projectId}
                onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}
              >
                {dropdownProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ASSIGN TO</label>
              <select
                className="input-control"
                value={form.assignedTo}
                onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}
              >
                <option value="">— Select Member —</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">PRIORITY</label>
              <select
                className="input-control"
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              >
                {['Critical', 'High', 'Medium', 'Low'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ETA (HOURS)</label>
              <input
                type="number"
                min="1"
                className="input-control"
                value={form.eta}
                onChange={e => setForm(p => ({ ...p, eta: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}>
              Create Task
            </button>
          </div>
        </form>

        {/* ── Active Team Tasks ── */}
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.5rem' }}>
            Active Team Tasks ({teamTasks.length})
          </span>
          {teamTasks.length === 0 ? (
            <div style={{
              padding: '1.5rem', textAlign: 'center', fontSize: '0.78rem',
              color: 'var(--muted-foreground)', fontStyle: 'italic',
              border: '1px solid var(--border)', borderRadius: '8px',
            }}>
              No tasks assigned to members of this team yet.
            </div>
          ) : (
            <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)', textAlign: 'left', backgroundColor: 'var(--secondary)' }}>
                    {['Task', 'Project', 'Assignee', 'Priority', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.8rem', fontWeight: 700, fontSize: '0.7rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamTasks.map(t => {
                    const assignee = users.find(u => u.id === t.assignedTo);
                    const proj = projects.find(p => p.id === t.projectId);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => onSelectTask?.(t)}
                        style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
                          {t.taskNumber ? `${t.taskNumber}: ` : ''}{t.name}
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', color: proj?.color || 'var(--muted-foreground)', fontSize: '0.72rem' }}>
                          {proj ? proj.name.split(' (')[0] : '—'}
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem', color: 'var(--foreground)' }}>
                          {assignee?.name || '—'}
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td style={{ padding: '0.6rem 0.8rem' }}>
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
}