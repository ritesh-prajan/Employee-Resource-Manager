import React, { useState } from 'react';

export default function AssignTaskModal({ show, onClose, assignee, tasks, projects, onSubmit, onAssignExisting }) {
  const [taskData, setTaskData] = useState({
    name: '', projectId: '', priority: 'Medium', eta: '', etaDate: '', backlogTaskId: ''
  });
  const [showBacklogDropdown, setShowBacklogDropdown] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (taskData.backlogTaskId) {
      onAssignExisting(taskData.backlogTaskId, { assignedTo: assignee.id });
    } else {
      onSubmit({
        name: taskData.name,
        projectId: taskData.projectId,
        priority: taskData.priority,
        eta: parseFloat(taskData.eta),
        etaDate: taskData.etaDate,
        assignedTo: assignee.id,
        status: 'In Progress'
      });
    }
    setTaskData({ name: '', projectId: '', priority: 'Medium', eta: '', etaDate: '', backlogTaskId: '' });
    onClose();
  };

  if (!show || !assignee) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Assign Task to {assignee.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  return { ...prev, name: val, backlogTaskId: exactMatch ? exactMatch.id : '' };
                });
                setShowBacklogDropdown(true);
              }}
              onFocus={() => setShowBacklogDropdown(true)}
              onBlur={() => setTimeout(() => setShowBacklogDropdown(false), 200)}
              required
            />
            {showBacklogDropdown && (() => {
              const allBacklogs = tasks.filter(t => !t.assignedTo || t.assignedTo === '');
              const matchingBacklogs = taskData.name.trim().length >= 1
                ? allBacklogs.filter(t =>
                    t.name.toLowerCase().includes(taskData.name.toLowerCase()) ||
                    t.taskNumber.toLowerCase().includes(taskData.name.toLowerCase())
                  )
                : [];

              if (matchingBacklogs.length === 0) return null;

              return (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '150px', overflowY: 'auto', marginTop: '2px' }}>
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
                        style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
            })()}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">PROJECT *</label>
              <select className="input-control" value={taskData.projectId} onChange={(e) => setTaskData(prev => ({ ...prev, projectId: e.target.value }))} required>
                <option value="" disabled>Select a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">PRIORITY</label>
              <select className="input-control" value={taskData.priority} onChange={(e) => setTaskData(prev => ({ ...prev, priority: e.target.value }))}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="keep-inline-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ESTIMATED HOURS (ETA) *</label>
              <input type="number" className="input-control" min="1" value={taskData.eta} onChange={(e) => setTaskData(prev => ({ ...prev, eta: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">ETA DATE *</label>
              <input type="date" className="input-control" value={taskData.etaDate} onChange={(e) => setTaskData(prev => ({ ...prev, etaDate: e.target.value }))} required />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0010AE', color: '#ffffff' }}>Assign Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}