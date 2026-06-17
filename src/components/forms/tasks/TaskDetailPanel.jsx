import React, { useState, useEffect } from 'react';
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
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState('09:00');
  const [sessionHours, setSessionHours] = useState('');
  const [sessionCategory, setSessionCategory] = useState('Story');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionJustification, setSessionJustification] = useState('');

  useEffect(() => {
    if (task) {
      setSessionDate(new Date().toISOString().split('T')[0]);
      setSessionStartTime('09:00');
      setSessionHours('');
      setSessionCategory(task.type || 'Story');
      setSessionDescription('');
      setSessionJustification('');
    }
  }, [task?.id, task?.type]);
  if (!task) return null;
  const enteredHours = parseFloat(sessionHours) || 0;

  const proj = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assignedTo);
  const comments = task.comments || (taskComments && taskComments[task.id]) || [];
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[6px] p-4"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                    {task.taskNumber}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                  {task.status === 'Rejected' && <AlertTriangle size={13} className="text-amber-500" />}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{task.name}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-100 px-4 py-1.5 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 text-slate-700 transition cursor-pointer border-none"
              >
                <ChevronUp size={14} /> Close
              </button>
            </div>

            <div className="flex flex-col gap-5 pt-2">

              {/* Rejected warning */}
              {task.status === 'Rejected' && task.etaExceededComment && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium leading-relaxed">
                  <strong>Rejection Note:</strong> {task.etaExceededComment}
                </div>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Project', value: proj?.name.split(' (')[0] || 'General', color: proj?.color },
                  { label: 'Type', value: task.type },
                  { label: 'Priority', value: task.priority, color: task.priority === 'Critical' ? '#ef4444' : task.priority === 'High' ? '#f59e0b' : '#3b82f6' },
                  { label: 'Epic', value: task.epic || 'Backlog' },
                  { label: 'Estimate', value: `${task.eta}h` },
                  { label: 'Logged', value: `${task.logged}h`, color: task.logged > task.eta ? '#ef4444' : undefined },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-sm font-semibold" style={{ color: color || '#1e293b' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Assignee + ETA Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assignee</span>
                  {canLead ? (
                    <select
                      className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                      value={task.assignedTo || ''}
                      onChange={(e) => onDirectReassign(task.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 py-1">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                        {assignee ? (() => { const p = assignee.name.trim().split(/\s+/); return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : assignee.name.substring(0, 2).toUpperCase(); })() : '?'}
                      </div>
                      {assignee?.name || 'Unassigned'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ETA Date</span>
                  {canLead ? (
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border border-slate-200 py-2 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                      value={getDatetimeInputValue(task.etaDate)}
                      onChange={(e) => onDirectUpdateETA(task.id, e.target.value, undefined)}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-800 py-1.5 block">
                      {task.etaDate ? new Date(task.etaDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons — member actions */}
              {isMyTask && (
                <div className="w-full">
                  {isActive ? (
                    <div className="flex flex-col gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-3 text-slate-700">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Clock size={16} className="text-[#0010AE]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Timesheet Session Logging</h4>
                      </div>

                      {/* Date & Start Time */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date Working</label>
                          <input
                            type="date"
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Start Time</label>
                          <input
                            type="time"
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                            value={sessionStartTime}
                            onChange={(e) => setSessionStartTime(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Hours Worked & Category */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Hours Worked</label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            placeholder="e.g. 2.5"
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                            value={sessionHours}
                            onChange={(e) => setSessionHours(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Category</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 py-2 px-3 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800 cursor-pointer"
                            value={sessionCategory}
                            onChange={(e) => setSessionCategory(e.target.value)}
                          >
                            <option value="Story">Story</option>
                            <option value="Bug">Bug</option>
                            <option value="Feature">Feature</option>
                            <option value="Review">Review</option>
                            <option value="R&D">R&D</option>
                            <option value="General">General</option>
                          </select>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Log Description</label>
                        <textarea
                          placeholder="Provide details of the work done in this session..."
                          rows="2"
                          className="w-full rounded-xl border border-slate-200 py-2 px-3 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800 resize-none"
                          value={sessionDescription}
                          onChange={(e) => setSessionDescription(e.target.value)}
                        />
                      </div>

                      {/* Over-ETA breach warning and Justification */}
                      {enteredHours > Math.max(0, task.eta - task.logged) && (
                        <div className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle size={14} className="text-red-500" />
                            ETA Limit Alert
                          </div>
                          <div>
                            Adding {enteredHours}h will bring the total logged time to {(task.logged + enteredHours).toFixed(2)}h, which exceeds the task's ETA of {task.eta}h. Justification is required.
                          </div>
                          <div className="flex flex-col gap-1 mt-1 text-slate-700">
                            <label className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Over-ETA Justification (Required)</label>
                            <input
                              type="text"
                              placeholder="Provide a brief explanation for exceeding the ETA..."
                              className="w-full rounded-lg border border-red-200 py-1.5 px-2.5 outline-none focus:border-red-500 transition text-xs bg-white text-slate-800"
                              value={sessionJustification}
                              onChange={(e) => setSessionJustification(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="button"
                          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 border border-emerald-500"
                          onClick={() => {
                            const entryData = {
                              date: sessionDate,
                              startTime: sessionStartTime,
                              duration: enteredHours,
                              workCategory: sessionCategory,
                              description: sessionDescription,
                              justification: sessionJustification
                            };
                            onTriggerFinish(task, entryData);
                          }}
                        >
                          <CheckSquare size={16} /> Submit for Review
                        </button>
                        <button
                          type="button"
                          className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer bg-white flex items-center justify-center gap-1.5"
                          onClick={() => {
                            const entryData = {
                              date: sessionDate,
                              startTime: sessionStartTime,
                              duration: enteredHours,
                              workCategory: sessionCategory,
                              description: sessionDescription,
                              justification: sessionJustification
                            };
                            onTriggerPause(task, entryData);
                          }}
                        >
                          <Clock size={14} /> Pause Working
                        </button>
                      </div>
                    </div>
                  ) : (
                    task.status !== 'Completed' && task.status !== 'Pending Review' && (
                      <div className="flex flex-col gap-2.5">
                        <button
                          type="button"
                          className="w-full py-3.5 bg-[#0010AE] hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 border border-[#0010AE]"
                          onClick={() => onStartTask(task)}
                        >
                          <Play size={16} /> Start Working
                        </button>
                        <div className="grid grid-cols-2 gap-3 w-full">
                          <button
                            type="button"
                            className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer bg-white flex items-center justify-center gap-1.5"
                            onClick={() => { onClose(); onOpenETA(task.id); }}
                          >
                            <Calendar size={14} /> Request ETA Extension
                          </button>
                          <button
                            type="button"
                            className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer bg-white flex items-center justify-center gap-1.5"
                            onClick={() => { onClose(); onOpenTransfer(task.id); }}
                          >
                            <User size={14} /> Request Transfer
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Backlog claim button */}
              {!task.assignedTo && !isAdmin && (
                <button
                  type="button"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 text-white rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => { claimBacklogTask(task.id); onClose(); }}
                >
                  <CheckSquare size={16} /> Claim This Task
                </button>
              )}

              {/* Pending ETA review */}
              {canLead && pendingETA && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-amber-600 flex items-center gap-1">⏳ Pending ETA Extension Request</div>
                  <div className="text-xs text-slate-600">
                    Proposed: <strong className="text-slate-800 font-medium">{new Date(pendingETA.proposedDate).toLocaleDateString()}</strong> — {pendingETA.reason}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      onClick={() => onResolveETA(task.id, true)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition cursor-pointer bg-white"
                      onClick={() => onResolveETA(task.id, false)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Transfer review */}
              {canLead && pendingTransfer && (
                <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-purple-600 flex items-center gap-1">🔁 Pending Transfer Request</div>
                  <div className="text-xs text-slate-600">
                    To: <strong className="text-slate-800 font-medium">{users.find(u => String(u.id) === String(pendingTransfer.toUserId))?.name || 'Unknown'}</strong> — {pendingTransfer.reason}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                      onClick={() => onResolveTransfer(task.id, true)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition cursor-pointer bg-white"
                      onClick={() => onResolveTransfer(task.id, false)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="flex flex-col gap-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Activity ({comments.length})
                </div>
                <div className="flex flex-col gap-3.5 max-h-48 overflow-y-auto pr-1">
                  {comments.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-2">No activity yet.</div>
                  )}
                  {comments.map((c, i) => {
                    const author = users.find(u => String(u.id) === String(c.userId));
                    const isSystem = c.text?.startsWith('[');
                    return (
                      <div key={i} className="flex gap-2.5 items-start">
                        {!isSystem && (
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200 flex-shrink-0 mt-0.5">
                            {author ? (() => { const p = author.name.trim().split(/\s+/); return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : author.name.substring(0, 2).toUpperCase(); })() : '?'}
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="text-xs">
                            {!isSystem && <strong className="font-semibold text-slate-700 mr-1">{author?.name || 'Unknown'}</strong>}
                            <span className={isSystem ? 'text-slate-400 italic text-[11px]' : 'text-slate-600'}>
                              {c.text}
                            </span>
                          </div>
                          {c.timestamp && (
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {new Date(c.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add comment */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    className="flex-1 rounded-xl border border-slate-200 py-2 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                    placeholder="Add a comment..."
                    value={newComment[task.id] || ''}
                    onChange={(e) => setNewComment(prev => ({ ...prev, [task.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddComment(task.id); } }}
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#0010AE] hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center justify-center border border-[#0010AE] hover:border-blue-800"
                    onClick={() => onAddComment(task.id)}
                  >
                    <Send size={14} />
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