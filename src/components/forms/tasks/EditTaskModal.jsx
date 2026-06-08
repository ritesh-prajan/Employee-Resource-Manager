import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditTaskModal({ show, onClose, onSubmit, editingTask, setEditingTask, projects, users, isAdmin, ledProjectIds }) {
  if (!editingTask) return null;

  const availableProjects = projects.filter(p => isAdmin || ledProjectIds.includes(p.id));
  const availableUsers = users.filter(u => u.status === 'Active');

  return (
    <AnimatePresence>
      {show && (
        <div className="modal-overlay">
          <motion.div
            className="modal-content liquid-glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Edit Task — {editingTask.taskNumber}</h3>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="form-group">
                <label className="form-label">Task Summary</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-input"
                  value={editingTask.projectId}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, projectId: e.target.value }))}
                  required
                >
                  <option value="">Select project...</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select
                  className="form-input"
                  value={editingTask.assignedTo}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, assignedTo: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Estimate (hrs)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.5"
                    value={editingTask.eta}
                    onChange={(e) => setEditingTask(prev => ({ ...prev, eta: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={editingTask.type}
                    onChange={(e) => setEditingTask(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {['Story', 'Bug', 'Task', 'Spike', 'Epic'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-input"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask(prev => ({ ...prev, status: e.target.value }))}
                  >
                    {['Open', 'In Progress', 'Paused', 'Pending Review', 'Completed', 'Rejected'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}