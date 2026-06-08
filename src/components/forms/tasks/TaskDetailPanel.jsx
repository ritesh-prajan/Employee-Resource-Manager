import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, CheckSquare, Clock, Calendar, AlertTriangle,
  CheckCircle2, MessageSquare, Send, ChevronDown, ChevronUp,
  Trash2, Pencil, User
} from 'lucide-react';

export default function TaskDetailPanel({
  show, onClose, task,
  currentUser, users, projects,
  timerState, taskComments,
  isAdmin, isLeader,
  ledProjectIds, ledMemberIds,
  etaExtensions, taskTransfers,
  newComment, setNewComment,
  progressValue, setProgressValue,
  progressNote, setProgressNote,
  onStartTask, onTriggerPause, onTriggerFinish,
  onAddComment, onProgressUpdate,
  onOpenETA, onOpenTransfer,
  onResolveETA, onResolveTransfer,
  onDirectReassign, onDirectUpdateETA,
  onEditTask, onDeleteTask,
  onClaimBacklog, claimBacklogTask,
  getStatusColor, checkTaskExceedsETA,
  getDatetimeInputValue,
}) {
  if (!task) return null;

  const proj = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assignedTo);
  const comments = (taskComments[task.id] || []);
  const isMyTask = task.assignedTo === currentUser.id;
  const isActive = timerState.isClockedIn && timerState.taskId === task.id;
  const isOverrun = checkTaskExceedsETA(task);
  const canLead = isAdmin || (isLeader && (ledProjectIds.includes(task.projectId) || ledMemberIds.has(task.assignedTo)));
  const pct = Math.min(100, Math.round((task.logged / task.eta) * 100)) || 0;

  const pendingETA = etaExtensions.find(e => e.taskId === task.id && e.status === 'Pending');
  const pendingTransfer = taskTransfers.find(t => t.taskId === task.id && t.status === 'Pending');
  const activeUsers = users.filter(u => u.status === 'Active');

  return (
    <AnimatePresence>
      {show && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="modal-content liquid-glass-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="modal-header" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                    {task.taskNumber}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: getStatusColor(task.status) }}>
                    {task.status}
                  </span>
                  {task.status === 'Rejected' && <AlertTriangle size={13} color="#eab308" />}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{task.name}</h3>
              </div>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1rem' }}>

              {/* Rejected warning */}
              {task.status === 'Rejected' && task.etaExceededComment && (
                <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#eab308' }}>
                  <strong>Rejection Note:</strong> {task.etaExceededComment}
                </div>
              )}

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Project', value: proj?.name.split(' (')[0] || 'General', color: proj?.color },
                  { label: 'Type', value: task.type },
                  { label: 'Priority', value: task.priority, color: task.priority === 'Critical' ? '#ef4444' : task.priority === 'High' ? '#f59e0b' : '#3b82f6' },
                  { label: 'Epic', value: task.epic || 'Backlog' },
                  { label: 'Estimate', value: `${task.eta}h` },
                  { label: 'Logged', value: `${task.logged}h`, color: task.logged > task.eta ? '#ef4444' : undefined },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '0.65rem 0.85rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: color || 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{task.progress || pct}%</span>
                </div>
                <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: `${task.progress || pct}%`, height: '100%', backgroundColor: task.logged > task.eta ? '#ef4444' : (proj?.color || '#2998ff'), borderRadius: '3px' }} />
                </div>
              </div>

              {/* Assignee + ETA Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Assignee</span>
                  {canLead ? (
                    <select
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                      value={task.assignedTo || ''}
                      onChange={(e) => onDirectReassign(task.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                      <div className="user-initials-badge" style={{ width: '22px', height: '22px', fontSize: '0.6rem' }}>
                        {assignee ? (() => { const p = assignee.name.trim().split(/\s+/); return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : assignee.name.substring(0, 2).toUpperCase(); })() : '?'}
                      </div>
                      {assignee?.name || 'Unassigned'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ETA Date</span>
                  {canLead ? (
                    <input
                      type="datetime-local"
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                      value={getDatetimeInputValue(task.etaDate)}
                      onChange={(e) => onDirectUpdateETA(task.id, e.target.value, undefined)}
                    />
                  ) : (
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      {task.etaDate ? new Date(task.etaDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons — member actions */}
              {isMyTask && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {(task.status === 'Open' || task.status === 'Paused' || task.status === 'Rejected') && !isActive && (
                    <button className="btn btn-primary" onClick={() => onStartTask(task)} style={{ fontSize: '0.8rem', gap: '0.4rem' }}>
                      <Play size={13} /> Start Task
                    </button>
                  )}
                  {isActive && (
                    <>
                      <button className="btn btn-secondary" onClick={() => onTriggerPause(task)} style={{ fontSize: '0.8rem' }}>
                        <Clock size={13} /> Pause
                      </button>
                      <button className="btn btn-primary" onClick={() => onTriggerFinish(task)} style={{ fontSize: '0.8rem', backgroundColor: '#32bf90', borderColor: '#32bf90' }}>
                        <CheckSquare size={13} /> Submit for Review
                      </button>
                    </>
                  )}
                  {!isActive && task.status !== 'Completed' && task.status !== 'Pending Review' && (
                    <>
                      <button className="btn btn-secondary" onClick={() => { onClose(); onOpenETA(task.id); }} style={{ fontSize: '0.8rem' }}>
                        <Calendar size={13} /> Request ETA Extension
                      </button>
                      <button className="btn btn-secondary" onClick={() => { onClose(); onOpenTransfer(task.id); }} style={{ fontSize: '0.8rem' }}>
                        <User size={13} /> Request Transfer
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Backlog claim button */}
              {!task.assignedTo && !isAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={() => { claimBacklogTask(task.id); onClose(); }}
                  style={{ fontSize: '0.8rem', backgroundColor: '#32bf90', borderColor: '#32bf90', alignSelf: 'flex-start' }}
                >
                  <CheckSquare size={13} /> Claim This Task
                </button>
              )}

              {/* Leader actions */}
              {canLead && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => { onEditTask(task); onClose(); }} style={{ fontSize: '0.8rem' }}>
                    <Pencil size={13} /> Edit Task
                  </button>
                  {isAdmin && (
                    <button className="btn btn-secondary" onClick={() => { onDeleteTask(task.id); onClose(); }} style={{ fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              )}

              {/* Pending ETA review */}
              {canLead && pendingETA && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>⏳ Pending ETA Extension Request</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Proposed: {new Date(pendingETA.proposedDate).toLocaleDateString()} — {pendingETA.reason}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => onResolveETA(task.id, true)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', backgroundColor: '#32bf90', borderColor: '#32bf90' }}>Approve</button>
                    <button className="btn btn-secondary" onClick={() => onResolveETA(task.id, false)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', color: '#ef4444', borderColor: '#ef4444' }}>Decline</button>
                  </div>
                </div>
              )}

              {/* Pending Transfer review */}
              {canLead && pendingTransfer && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', marginBottom: '4px' }}>🔁 Pending Transfer Request</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    To: {users.find(u => u.id === pendingTransfer.toUserId)?.name || 'Unknown'} — {pendingTransfer.reason}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => onResolveTransfer(task.id, true)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', backgroundColor: '#32bf90', borderColor: '#32bf90' }}>Approve</button>
                    <button className="btn btn-secondary" onClick={() => onResolveTransfer(task.id, false)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', color: '#ef4444', borderColor: '#ef4444' }}>Decline</button>
                  </div>
                </div>
              )}

              {/* Progress update — member only */}
              {isMyTask && task.status === 'In Progress' && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Update Progress</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input
                      type="range"
                      min={0} max={100} step={5}
                      value={progressValue[task.id] ?? task.progress ?? pct}
                      onChange={(e) => setProgressValue(prev => ({ ...prev, [task.id]: parseInt(e.target.value) }))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '36px' }}>{progressValue[task.id] ?? task.progress ?? pct}%</span>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Progress note (optional)..."
                    value={progressNote[task.id] || ''}
                    onChange={(e) => setProgressNote(prev => ({ ...prev, [task.id]: e.target.value }))}
                    style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}
                  />
                  <button className="btn btn-primary" onClick={() => onProgressUpdate(task.id)} style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}>
                    Save Progress
                  </button>
                </div>
              )}

              {/* Comments */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Activity ({comments.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                  {comments.length === 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No activity yet.</div>
                  )}
                  {comments.map((c, i) => {
                    const author = users.find(u => u.id === c.userId);
                    const isSystem = c.text?.startsWith('[');
                    return (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        {!isSystem && (
                          <div className="user-initials-badge" style={{ width: '22px', height: '22px', fontSize: '0.6rem', flexShrink: 0, marginTop: '2px' }}>
                            {author ? (() => { const p = author.name.trim().split(/\s+/); return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : author.name.substring(0, 2).toUpperCase(); })() : '?'}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          {!isSystem && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{author?.name || 'Unknown'} · </span>}
                          <span style={{ fontSize: isSystem ? '0.72rem' : '0.8rem', color: isSystem ? 'var(--text-muted)' : 'var(--text-primary)', fontStyle: isSystem ? 'italic' : 'normal' }}>
                            {c.text}
                          </span>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add comment */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add a comment..."
                    value={newComment[task.id] || ''}
                    onChange={(e) => setNewComment(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddComment(task.id); } }}
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => onAddComment(task.id)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}