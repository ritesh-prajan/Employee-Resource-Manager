import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown } from 'lucide-react';

export default function CreateTaskModal({
  show, onClose, onSubmit,
  projects, tasks, users,
  isAdmin, ledProjectIds,
  taskData, setTaskData,
  stagedTasks, setStagedTasks,
  assignForm, setAssignForm,
  showAssignForm, setShowAssignForm,
  showBacklogDropdown, setShowBacklogDropdown,
}) {
  const availableProjects = projects.filter(p => isAdmin || ledProjectIds.includes(p.id));
  const availableUsers = users.filter(u => u.status === 'Active');

  const backlogTasks = tasks.filter(t =>
    (!t.assignedTo || t.assignedTo === '') &&
    (!taskData.projectId || t.projectId === taskData.projectId)
  );

  const handleStage = (e) => {
    e?.preventDefault();
    if (!assignForm.assignedTo) { alert("Please select an assignee."); return; }
    if (!assignForm.name.trim()) { alert("Please enter a task summary."); return; }

    if (assignForm.backlogTaskId) {
      const backlogTask = tasks.find(t => t.id === assignForm.backlogTaskId);
      if (!backlogTask) return;
      if (stagedTasks.some(t => !t.isNew && t.backlogTaskId === backlogTask.id)) {
        alert("This backlog task is already staged."); return;
      }
      setStagedTasks(prev => [...prev, {
        id: `staged-backlog-${Date.now()}`,
        isNew: false,
        backlogTaskId: backlogTask.id,
        name: `${backlogTask.taskNumber}: ${backlogTask.name}`,
        assignedTo: assignForm.assignedTo
      }]);
    } else {
      setStagedTasks(prev => [...prev, {
        id: `staged-new-${Date.now()}`,
        isNew: true,
        name: assignForm.name,
        eta: parseFloat(assignForm.eta) || 8,
        type: assignForm.type,
        priority: assignForm.priority,
        assignedTo: assignForm.assignedTo
      }]);
    }

    setAssignForm(prev => ({ ...prev, name: '', backlogTaskId: '', eta: '8', assignedTo: '' }));
    setShowAssignForm(false);
    setShowBacklogDropdown(false);
  };

  const handlePublish = (e) => {
    e.preventDefault();
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
            style={{ maxWidth: '620px', width: '100%' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Assign Tasks to Team Members</h3>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Select a project, stage tasks per assignee, then publish all at once.
            </p>

            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Project selector */}
              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-input"
                  value={taskData.projectId}
                  onChange={(e) => setTaskData(prev => ({ ...prev, projectId: e.target.value }))}
                  required
                >
                  <option value="">Select project...</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
                  ))}
                </select>
              </div>

              {/* Staged tasks list */}
              {stagedTasks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="form-label">Staged Tasks ({stagedTasks.length})</label>
                  {stagedTasks.map(staged => {
                    const assignee = users.find(u => u.id === staged.assignedTo);
                    return (
                      <div key={staged.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600 }}>{staged.name}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                            → {assignee?.name || 'Unknown'} {staged.isNew ? `· ${staged.eta}h · ${staged.type} · ${staged.priority}` : '· from backlog'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStagedTasks(prev => prev.filter(t => t.id !== staged.id))}
                          style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add task row */}
              {showAssignForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>

                  {/* Backlog or New toggle */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setAssignForm(prev => ({ ...prev, backlogTaskId: '', name: '' })); setShowBacklogDropdown(false); }}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: !assignForm.backlogTaskId ? 'var(--pastel-blue)' : 'transparent', color: !assignForm.backlogTaskId ? '#fff' : 'var(--text-secondary)' }}
                    >
                      New Task
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowBacklogDropdown(true); setAssignForm(prev => ({ ...prev, name: '' })); }}
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: showBacklogDropdown ? 'var(--pastel-blue)' : 'transparent', color: showBacklogDropdown ? '#fff' : 'var(--text-secondary)' }}
                    >
                      From Backlog
                    </button>
                  </div>

                  {showBacklogDropdown ? (
                    <div className="form-group">
                      <label className="form-label">Select Backlog Task</label>
                      <select
                        className="form-input"
                        value={assignForm.backlogTaskId}
                        onChange={(e) => {
                          const t = tasks.find(t => t.id === e.target.value);
                          setAssignForm(prev => ({ ...prev, backlogTaskId: e.target.value, name: t ? `${t.taskNumber}: ${t.name}` : '' }));
                        }}
                      >
                        <option value="">Select backlog task...</option>
                        {backlogTasks.map(t => (
                          <option key={t.id} value={t.id}>{t.taskNumber}: {t.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Task Summary / Ticket</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. PROJ-42: Build dashboard UI"
                          value={assignForm.name}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Estimate (hrs)</label>
                          <input
                            type="number"
                            className="form-input"
                            min="1"
                            value={assignForm.eta}
                            onChange={(e) => setAssignForm(prev => ({ ...prev, eta: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Type</label>
                          <select className="form-input" value={assignForm.type} onChange={(e) => setAssignForm(prev => ({ ...prev, type: e.target.value }))}>
                            {['Story', 'Bug', 'Task', 'Spike', 'Epic'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Priority</label>
                          <select className="form-input" value={assignForm.priority} onChange={(e) => setAssignForm(prev => ({ ...prev, priority: e.target.value }))}>
                            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">Assign To</label>
                    <select
                      className="form-input"
                      value={assignForm.assignedTo}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    >
                      <option value="">Select assignee...</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowAssignForm(false); setShowBacklogDropdown(false); }} style={{ fontSize: '0.8rem' }}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleStage} style={{ fontSize: '0.8rem', backgroundColor: '#32bf90', borderColor: '#32bf90' }}>
                      <Plus size={13} /> Stage Task
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAssignForm(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', border: '1px dashed var(--border-color)', borderRadius: '10px', background: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  <Plus size={14} /> Add Task
                </button>
              )}

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={stagedTasks.length === 0 || !taskData.projectId}>
                  Publish {stagedTasks.length > 0 ? `${stagedTasks.length} Task${stagedTasks.length > 1 ? 's' : ''}` : 'Tasks'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}