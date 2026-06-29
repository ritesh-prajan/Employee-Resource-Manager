import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Link2, ChevronUp, Send } from 'lucide-react';
import { projectService } from '#services/projectService';
import SearchableSelect from '../../ui/SearchableSelect';
import { useToast } from '../../../context/ToastContext';

export default function CreateTaskModal({
  show, onClose, onSubmit,
  projects, tasks, users,
  isAdmin, ledProjectIds,
  taskData, setTaskData,
  stagedTasks, setStagedTasks,
  assignForm, setAssignForm,
  showAssignForm, setShowAssignForm,
  showBacklogDropdown, setShowBacklogDropdown,
  onDiscardDraft,
  // Teams Integration props
  teams = [],
  teamsGroupId,
  setTeamsGroupId,
  teamsChannelId,
  setTeamsChannelId,
  currentUser
}) {
  const toast = useToast();
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isSummaryFocused, setIsSummaryFocused] = useState(false);

  // Compute teams the current user is a member of and has Group/Channel IDs set
  const myTeams = React.useMemo(() => {
    if (!teams || !currentUser) return [];
    return teams.filter(t =>
      t.members.map(String).includes(String(currentUser.id)) &&
      t.teamsGroupId && t.teamsGroupId.trim() !== '' &&
      t.teamsChannelId && t.teamsChannelId.trim() !== ''
    );
  }, [teams, currentUser]);

  const handleTeamChange = (teamId) => {
    const selectedTeam = myTeams.find(t => String(t.id) === String(teamId));
    if (selectedTeam) {
      setTeamsGroupId(selectedTeam.teamsGroupId);
      setTeamsChannelId(selectedTeam.teamsChannelId);
    } else {
      setTeamsGroupId('');
      setTeamsChannelId('');
    }
  };

  // Auto-select if there is exactly 1 team channel available
  React.useEffect(() => {
    if (show && myTeams.length === 1 && !teamsChannelId) {
      setTeamsGroupId(myTeams[0].teamsGroupId);
      setTeamsChannelId(myTeams[0].teamsChannelId);
    }
  }, [show, myTeams, teamsChannelId]);



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

  const availableProjects = projects.filter(p => isAdmin || ledProjectIds.map(id => String(id)).includes(String(p.id)));
  const availableUsers = projectMembers;

  const projectOptions = availableProjects.map(p => ({
    value: String(p.id),
    label: p.name.split(' (')[0]
  }));

  const assigneeOptions = [
    { value: '', label: 'Unassigned (Backlog)' },
    ...availableUsers.map(u => ({
      value: String(u.id),
      label: `${u.name} — ${u.designation}`
    }))
  ];

  const handleProjectChange = (val) => {
    setTaskData(prev => ({ ...prev, projectId: val }));
  };

  const handleAssigneeChange = (val) => {
    setAssignForm(prev => ({ ...prev, assignedTo: val }));
  };

  const backlogTasks = tasks.filter(t =>
    (!t.assignedTo || t.assignedTo === '') &&
    (!taskData.projectId || String(t.projectId) === String(taskData.projectId))
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
    if (!assignForm.name.trim()) { toast.warning("Please enter a task summary."); return; }

    if (assignForm.backlogTaskId) {
      const backlogTask = tasks.find(t => t.id === assignForm.backlogTaskId);
      if (!backlogTask) return;
      if (stagedTasks.some(t => !t.isNew && t.backlogTaskId === backlogTask.id)) {
        toast.warning("This backlog task is already staged."); return;
      }
      setStagedTasks(prev => [...prev, {
        id: `staged-backlog-${Date.now()}`,
        isNew: false,
        backlogTaskId: backlogTask.id,
        name: `${backlogTask.taskNumber}: ${backlogTask.name}`,
        assignedTo: assignForm.assignedTo
      }]);
    } else {
      if (!assignForm.taskNumber?.trim()) { toast.warning("Please enter a Task Number."); return; }
      if (!assignForm.etaDate) { toast.warning("Please enter an ETA Date."); return; }
      if (assignForm.type === 'Bug' && !assignForm.bugNumber?.trim()) { toast.warning("Please enter a Bug Number."); return; }
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
    setShowAssignForm(false);
  };

  const handlePublish = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <AnimatePresence>
      {show && (
        <div
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[6px] p-4"
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="modal-content max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl text-left"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <div className="mb-4 flex items-center justify-between modal-header">
              <div className="flex items-center gap-2">
                <Plus size={20} className="text-[#0010AE]" />
                <h2 className="text-lg font-semibold text-slate-800">
                  Assign Tasks to Team Members
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-100 px-4 py-1.5 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 text-slate-700 transition cursor-pointer border-none"
              >
                <ChevronUp size={14} /> Close
              </button>
            </div>
            <p className="text-slate-500 text-xs mb-4">
              Select a project, stage tasks per assignee, then publish all at once.
            </p>

            <form onSubmit={handlePublish} className="space-y-4">

              {/* Project selector */}
              <div className="form-group flex flex-col">
                <label className="mb-1 block font-semibold text-sm text-slate-700">Project</label>
                <SearchableSelect
                  options={projectOptions}
                  value={String(taskData.projectId || '')}
                  onChange={handleProjectChange}
                  placeholder="Select project..."
                  style={{ width: '100%' }}
                  className="w-full rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                  inputStyle={{
                    padding: '0.625rem 0.875rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#F0F2F5',
                    borderRadius: '0.75rem',
                    border: '1px solid #E2E8F0',
                    height: 'auto',
                    minHeight: '40px'
                  }}
                />
              </div>

              {/* Teams Channel Selector */}
              <div className="form-group flex flex-col">
                <label className="mb-1 block font-semibold text-sm text-slate-700">Target Teams Channel</label>
                {myTeams.length === 0 ? (
                  <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-red-500 text-xs font-semibold">
                    You are not assigned to any team with configured Teams Group and Channel IDs. Please ask an admin to configure them.
                  </div>
                ) : (
                  <select
                    className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                    value={myTeams.find(t => t.teamsChannelId === teamsChannelId)?.id || ''}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    required
                  >
                    <option value="">Select Team Channel...</option>
                    {myTeams.map(t => (
                      <option key={t.id} value={String(t.id)}>
                        {t.teamName || t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Staged tasks list */}
              {stagedTasks.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-sm text-slate-700">Staged Tasks ({stagedTasks.length})</label>
                    {onDiscardDraft && (
                      <button
                        type="button"
                        onClick={onDiscardDraft}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold transition cursor-pointer bg-transparent border-none flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Discard All
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {stagedTasks.map(staged => {
                      const assignee = users.find(u => String(u.id) === String(staged.assignedTo));
                      return (
                        <div
                          key={staged.id}
                          className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition hover:bg-slate-100/80"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-slate-800">{staged.name}</span>
                            <span className="text-xs text-slate-500">
                              assigned to <strong className="text-slate-700 font-medium">{assignee?.name || 'Unassigned'}</strong> {staged.isNew ? `· ${staged.eta} hrs · ${staged.type} · ${staged.priority} Priority` : '· from backlog'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStagedTasks(prev => prev.filter(t => t.id !== staged.id))}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition cursor-pointer border-none bg-transparent flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add task row */}
              {showAssignForm ? (
                <div className="flex flex-col gap-4 p-5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm text-left">
                  {/* Sleek Auto-Suggest Search Input for Task Summary / Backlog */}
                  <div className="form-group relative">
                    <label className="mb-1 block font-semibold text-sm text-slate-700">Task Summary / Search Backlog</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
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
                      />

                      {/* Dropdown Suggestions */}
                      {isSummaryFocused && summaryMatches.length > 0 && (
                        <div 
                          className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto"
                        >
                          <div className="px-3.5 py-2 text-xs text-slate-400 border-b border-slate-100 bg-slate-50 font-bold uppercase tracking-wider">
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
                              className="px-3.5 py-2.5 text-xs cursor-pointer hover:bg-slate-50 transition border-b border-slate-100 flex flex-col gap-0.5 text-left"
                            >
                              <span className="font-semibold text-slate-800">{t.taskNumber}</span>
                              <span className="text-slate-600">{t.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!assignForm.backlogTaskId && (
                    <>
                      <div className="form-group">
                        <label className="mb-1 block font-semibold text-sm text-slate-700">Task Number (ID)</label>
                        <input
                          type="text"
                          className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                          placeholder="e.g. TSK-100"
                          value={assignForm.taskNumber || ''}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, taskNumber: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="mb-1 block font-semibold text-sm text-slate-700">Estimate (hrs)</label>
                          <input
                            type="number"
                            className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                            min="1"
                            value={assignForm.eta}
                            onChange={(e) => setAssignForm(prev => ({ ...prev, eta: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="mb-1 block font-semibold text-sm text-slate-700">Type</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                            value={assignForm.type}
                            onChange={(e) => setAssignForm(prev => ({ ...prev, type: e.target.value }))}
                          >
                            {['Story', 'Bug', 'Task', 'Spike', 'Epic'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="mb-1 block font-semibold text-sm text-slate-700">Priority</label>
                          <select
                            className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                            value={assignForm.priority}
                            onChange={(e) => setAssignForm(prev => ({ ...prev, priority: e.target.value }))}
                          >
                            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-group">
                          <label className="mb-1 block font-semibold text-sm text-slate-700">ETA Date</label>
                          <input
                            type="date"
                            className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
                            value={assignForm.etaDate || ''}
                            onChange={(e) => setAssignForm(prev => ({ ...prev, etaDate: e.target.value }))}
                            required
                          />
                        </div>
                        {assignForm.type === 'Bug' && (
                          <div className="form-group">
                            <label className="mb-1 block font-semibold text-sm text-slate-700">Bug Number</label>
                            <input
                              type="text"
                              className="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 outline-none focus:border-blue-500 transition text-sm bg-white text-slate-800"
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
                    <label className="mb-1 block font-semibold text-sm text-slate-700">
                      {loadingMembers ? "Loading Project Members..." : "Assign To"}
                    </label>
                    <SearchableSelect
                      options={assigneeOptions}
                      value={String(assignForm.assignedTo || '')}
                      onChange={handleAssigneeChange}
                      placeholder="Select assignee..."
                      disabled={loadingMembers}
                      style={{ width: '100%' }}
                      className="w-full rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition text-sm bg-[#F0F2F5] text-slate-800 cursor-pointer"
                      inputStyle={{
                        padding: '0.625rem 0.875rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#F0F2F5',
                        borderRadius: '0.75rem',
                        border: '1px solid #E2E8F0',
                        height: 'auto',
                        minHeight: '40px'
                      }}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer bg-white"
                      onClick={() => { setShowAssignForm(false); setShowBacklogDropdown(false); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 border border-emerald-500 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-1"
                      onClick={handleStage}
                    >
                      <Plus size={14} /> Stage Task
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAssignForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl bg-transparent text-slate-500 hover:text-blue-600 text-sm cursor-pointer font-semibold transition"
                >
                  <Plus size={16} /> Add Task
                </button>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition cursor-pointer bg-white"
                  onClick={onClose}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0010AE] hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed border border-[#0010AE] hover:border-blue-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                  disabled={stagedTasks.length === 0 || !taskData.projectId}
                >
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