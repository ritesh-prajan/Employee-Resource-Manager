import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateBacklogTaskModal({ show, onClose, onSubmit, projects, isAdmin, ledProjectIds, backlogCreateData, setBacklogCreateData }) {

  const availableProjects = projects.filter(p => isAdmin || ledProjectIds.includes(p.id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!backlogCreateData.projectId) { alert("Please select a project."); return; }
    if (!backlogCreateData.name.trim()) { alert("Please enter a task summary."); return; }
    onSubmit(e);
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="modal-overlay">
          <motion.div
            className="modal-content liquid-glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Create Backlog Task</h3>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Add an unassigned task to the backlog. It can be delegated to a team member later.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="form-group">
                <label className="form-label">Task Summary / Ticket</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PROJ-101: Implement login flow"
                  value={backlogCreateData.name}
                  onChange={(e) => setBacklogCreateData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-input"
                  value={backlogCreateData.projectId}
                  onChange={(e) => setBacklogCreateData(prev => ({ ...prev, projectId: e.target.value }))}
                  required
                >
                  <option value="">Select project...</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Estimate (hrs)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={backlogCreateData.eta}
                    onChange={(e) => setBacklogCreateData(prev => ({ ...prev, eta: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={backlogCreateData.type}
                    onChange={(e) => setBacklogCreateData(prev => ({ ...prev, type: e.target.value }))}
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
                    value={backlogCreateData.priority}
                    onChange={(e) => setBacklogCreateData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#32bf90', borderColor: '#32bf90' }}>
                  Add to Backlog
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}