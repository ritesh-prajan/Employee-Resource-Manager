import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { projectService } from '#services/projectService';

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
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSummaryFocused, setIsSummaryFocused] = useState(false);

  // Fetch project members dynamically when selected project changes
  useEffect(() => {
    if (!taskData.projectId) {
      setProjectMembers([]);
      return;
    }
    setLoadingMembers(true);
    projectService.getMembers(taskData.projectId)
      .then(members => {
        setProjectMembers(members);
      })
      .catch(err => {
        console.error("Failed to load project members:", err);
      })
      .finally(() => {
        setLoadingMembers(false);
      });
  }, [taskData.projectId]);

  const generateNextTaskNumber = () => {
    const numbers = tasks
      .map(t => t.taskNumber)
      .filter(n => n && /^TSK-\d+$/i.test(n))
      .map(n => parseInt(n.split('-')[1], 10));
    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `TASK-${String(next).padStart(3, '0')}`;
  };

  useEffect(() => {
    if (show) {
      setAssignForm(prev => ({ ...prev, taskNumber: generateNextTaskNumber() }));
    }
  }, [show]);

  const availableProjects = projects.filter(p => isAdmin || ledProjectIds.includes(p.id));
  const availableUsers = projectMembers;

  const backlogTasks = tasks.filter(t =>
    (!t.assignedTo || t.assignedTo === '') &&
    (!taskData.projectId || t.projectId === taskData.projectId)
  );

  // Filter backlog suggestion matches as user types
  const summaryMatches = assignForm.name && isSummaryFocused
    ? backlogTasks.filter(t => 
        t.name.toLowerCase().includes(assignForm.name.toLowerCase()) || 
        t.taskNumber.toLowerCase().includes(assignForm.name.toLowerCase())
      )
    : [];

  const handleStage = (e) => {
    e?.preventDefault();
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
      if (!assignForm.taskNumber?.trim()) { alert("Please enter a Task Number."); return; }
      if (!assignForm.etaDate) { alert("Please enter an ETA Date."); return; }
      if (assignForm.type === 'Bug' && !assignForm.bugNumber?.trim()) { alert("Please enter a Bug Number."); return; }
      setStagedTasks(prev => [...prev, {
        id: `staged-new-${Date.now()}`,
        isNew: true,
        name: assignForm.name,
        eta: parseFloat(assignForm.eta) || 8,
        type: assignForm.type,
        priority: assignForm.priority,
        assignedTo: assignForm.assignedTo,
        taskNumber: assignForm.taskNumber,
        etaDate: assignForm.etaDate,
        bugNumber: assignForm.bugNumber
      }]);
    }

    setAssignForm(prev => ({ ...prev, name: '', backlogTaskId: '', eta: '8', assignedTo: '', taskNumber: generateNextTaskNumber(), etaDate: '', bugNumber: '' }));
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
            style={{ maxWidth: '850px', width: '100%' }}
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

                  {/* Sleek Auto-Suggest Search Input for Task Summary / Backlog */}
                  <div className="form-group relative">
                    <label className="form-label">Task Summary / Search Backlog</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Type new task summary or start typing to search backlog..."
                        value={assignForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAssignForm(prev => ({
                            ...prev,
                            name: val,
                            backlogTaskId: '', // clear backlog association on typing custom summary
                            taskNumber: generateNextTaskNumber()
                          }));
                        }}
                        onFocus={() => setIsSummaryFocused(true)}
                        onBlur={() => {
                          // Small delay to allow click handlers on search dropdown to execute
                          setTimeout(() => setIsSummaryFocused(false), 200);
                        }}
                        required
                        style={{ width: '100%' }}
                      />

                      {/* Dropdown Suggestions */}
                      {isSummaryFocused && summaryMatches.length > 0 && (
                        <div 
                          style={{
                            position: 'absolute', left: 0, right: 0, top: '100%', marginTop: '4px',
                            backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto'
                          }}
                        >
                          <div style={{ padding: '6px 12px', fontSize: '10px', color: '#94a3b8', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontWeight: 600, textTransform: 'uppercase' }}>
                            Matching Backlog Tasks
                          </div>
                          {summaryMatches.map(t => (
                            <div
                              key={t.id}
                              onMouseDown={() => {
                                setAssignForm(prev => ({
                                  ...prev,
                                  backlogTaskId: t.id,
                                  name: `${t.taskNumber}: ${t.name}`,
                                  taskNumber: t.taskNumber
                                }));
                                setIsSummaryFocused(false);
                              }}
                              style={{
                                padding: '8px 12px', fontSize: '11px', cursor: 'pointer',
                                color: '#334155', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', flexDirection: 'column'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.taskNumber}</span>
                              <span style={{ color: '#64748b' }}>{t.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!assignForm.backlogTaskId && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Task Number (ID)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. TSK-100"
                          value={assignForm.taskNumber || ''}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, taskNumber: e.target.value }))}
                          required
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">ETA Date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={assignForm.etaDate || ''}
                            onChange={(e) => setAssignForm(prev => ({ ...prev, etaDate: e.target.value }))}
                            required
                          />
                        </div>
                        {assignForm.type === 'Bug' && (
                          <div className="form-group">
                            <label className="form-label">Bug Number</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. BUG-404"
                              value={assignForm.bugNumber || ''}
                              onChange={(e) => setAssignForm(prev => ({ ...prev, bugNumber: e.target.value }))}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      {loadingMembers ? "Loading Project Members..." : "Assign To"}
                    </label>
                    <select
                      className="form-input"
                      value={assignForm.assignedTo}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                      disabled={loadingMembers}
                      required
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