import React, { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle, Filter, Pencil, Trash2, CheckCircle, ChevronUp, RotateCcw, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../../context/ToastContext';
import { teamsService } from '../../services/teamsService';
import { draftService } from '../../services/draftService';
import { api } from '../../services/api';
import ETAExtensionModal from '../../components/forms/tasks/ETAExtensionModal';
import CreateTaskModal from '../../components/forms/tasks/CreateTaskModal';
import EditTaskModal from '../../components/forms/tasks/EditTaskModal';
import TaskDetailPanel from '../../components/forms/tasks/TaskDetailPanel';
import TransferModal from '../../components/forms/tasks/TransferModal';
import DataTable from '../../components/ui/DataTable';
import SearchableSelect from '../../components/ui/SearchableSelect';
import UserAvatar from '../../components/ui/UserAvatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog'
export default function Tasks({ setCurrentPage, initialScope }) {
  const { currentUser, projects, users, timerState, clockIn, clockOut, cancelTimer, teams, etaExtensions, taskTransfers, addManualEntry, claimBacklogTask, requestClaimBacklogTask, editTask } = useApp();
  const toast = useToast();

  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    removeTask,
    assignTask,
    unassignTask,
    addTaskComment,
    updateTaskProgress,
    createTransfer,
    approveTransfer,
    rejectTransfer,
    createEtaExtension,
    approveEtaExtension,
    rejectEtaExtension,
    submitTaskReview,
    approveTaskReview,
    rejectTaskReview,
    unsubmitTaskReview,
    undoTaskReview,
  } = useTasks();

  const isLeader = currentUser.role === 'Admin' || currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead';
  const isAdmin = currentUser.role === 'Admin';
  const ledTeams = teams ? teams.filter(t => String(t.leadId) === String(currentUser.id) || String(t.subLeadId) === String(currentUser.id)) : [];
  const ledMemberIds = new Set(ledTeams.flatMap(t => t.members).map(mId => String(mId)));
  const ledTeamIds = ledTeams.map(t => t.id);
  const ledProjectIds = projects ? projects.filter(p => (p.teams || []).some(tId => ledTeamIds.map(id => String(id)).includes(String(tId)))).map(p => p.id) : [];
  
  const [scope, setScope] = useState(initialScope || (isLeader ? 'all' : 'my'));
  React.useEffect(() => { if (initialScope) setScope(initialScope); }, [initialScope]);
  const [pendingdeletetask,setpendingdeletetask]=useState(null);
  const [pendingclaimtask,setpendingclaimtask]=useState(null)
  const [submittingTask, setSubmittingTask] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showExceededETA, setShowExceededETA] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [backlogSubScope, setBacklogSubScope] = useState('general');
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [delegatingTask, setDelegatingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showETAModal, setShowETAModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [etaDate, setEtaDate] = useState('');
  const [etaReason, setEtaReason] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [showOverrunPrompt, setShowOverrunPrompt] = useState(false);
  const [overrunActionType, setOverrunActionType] = useState('pause');
  const [overrunComments, setOverrunComments] = useState('');
  const [overrunTaskId, setOverrunTaskId] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [taskData, setTaskData] = useState({ name: '', projectId: '', assignedTo: '', eta: '', type: 'Story', epic: 'Backlog', priority: 'Medium' });
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [stagedTasks, setStagedTasks] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showBacklogDropdown, setShowBacklogDropdown] = useState(false);
  const [assignForm, setAssignForm] = useState({ name: '', backlogTaskId: '', eta: '8', type: 'Story', priority: 'Medium', assignedTo: '', taskNumber: '', etaDate: '', bugNumber: '' });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  const [showTeamsDraftModal, setShowTeamsDraftModal] = useState(false);
  const [teamsGroupId, setTeamsGroupId] = useState('');
  const [teamsChannelId, setTeamsChannelId] = useState('');

  const location = useLocation();
  const [highlightTaskId, setHighlightTaskId] = useState(null);

  React.useEffect(() => {
    if (location.state?.highlightTaskId) {
      const taskId = location.state.highlightTaskId;
      setHighlightTaskId(taskId);
      setExpandedTaskId(taskId);
      
      window.history.replaceState({}, document.title);
      
      const scrollTimer = setTimeout(() => {
        const rowEl = document.querySelector(`[data-task-id="${taskId}"]`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);

      const timer = setTimeout(() => {
        setHighlightTaskId(null);
      }, 2500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(timer);
      };
    }
  }, [location.state]);

  React.useEffect(() => {
    const stored = localStorage.getItem('erm_staged_tasks');
    if (stored) {
      try {
        setStagedTasks(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored staged tasks", e);
      }
    }
    const storedGroupId = localStorage.getItem('erm_teams_group_id');
    const storedChannelId = localStorage.getItem('erm_teams_channel_id');
    if (storedGroupId) setTeamsGroupId(storedGroupId);
    if (storedChannelId) setTeamsChannelId(storedChannelId);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('erm_staged_tasks', JSON.stringify(stagedTasks));
  }, [stagedTasks]);

  React.useEffect(() => {
    localStorage.setItem('erm_teams_group_id', teamsGroupId);
    localStorage.setItem('erm_teams_channel_id', teamsChannelId);
  }, [teamsGroupId, teamsChannelId]);

  const getProjectInfo = (projectId) => projects.find(p => p.id === projectId);
  const getUserInfo = (userId) => users.find(u => u.id === userId);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#4ade80';
      case 'Pending Review': return '#f472b6';
      case 'In Progress': return '#60a5fa';
      case 'ETA Extended': return '#fbbf24';
      case 'Transferred': return '#c084fc';
      case 'Paused': return '#e28743';
      case 'Rejected': return '#eab308';
      default: return '#94a3b8';
    }
  };

  const getActiveSessionHours = () => {
    if (!timerState.isClockedIn || !timerState.startTime) return 0;
    const start = new Date(timerState.startTime);
    const diffMs = new Date() - start;
    const breakMs = (timerState.totalBreakSeconds || 0) * 1000;
    const netMs = Math.max(0, diffMs - breakMs);
    let durationHours = netMs / (1000 * 60 * 60);
    if (durationHours < 0.05) durationHours = 0.5;
    return parseFloat(durationHours.toFixed(2));
  };

  const checkTaskExceedsETA = (task) => {
    // 1. Hours overrun — logged time exceeds the hours estimate
    const eta = parseFloat(task.eta);
    const isActive = timerState.isClockedIn && timerState.taskId === task.id;
    const sessionHours = isActive ? getActiveSessionHours() : 0;
    const logged = parseFloat(task.logged) || 0;
    const hoursExceeded = eta > 0 && (logged + sessionHours) > eta;

    // 2. Date overrun — etaDate deadline has passed and task is still open
    const completedStatuses = ['Completed', 'Pending Review'];
    const dateExceeded = task.etaDate &&
      new Date(task.etaDate) < new Date() &&
      !completedStatuses.includes(task.status);

    return hoursExceeded || dateExceeded;
  };

  const getDatetimeInputValue = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const tzoffset = date.getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    } catch { return ''; }
  };

  const handleETASubmit = () => {
    if (!activeTaskId || !etaDate || !etaReason) return;
    createEtaExtension.mutate({ taskId: activeTaskId, requestedById: currentUser.id, newEtaDate: etaDate, reason: etaReason });
    setShowETAModal(false);
  };

  const handleDelegateSubmit = async (taskId, memberId) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;
    try {
      const res = await updateTask.mutateAsync({
        id: taskId,
        data: {
          ...taskObj,
          assignedTo: memberId,
          status: 'Open'
        }
      });
      await draftService.appendTasks([res], users);
      toast.success('Task delegated and added to Teams draft batch');
    } catch (err) {
      console.error('Failed to delegate task:', err);
    }
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!activeTaskId || !transferTarget || !transferReason) return;
    createTransfer.mutate({ taskId: activeTaskId, fromEmployeeId: currentUser.id, toEmployeeId: transferTarget, reason: transferReason });
    setShowTransferModal(false);
  };

  const handleDirectReassign = async (taskId, newAssigneeId) => {
    try {
      if (newAssigneeId) {
        const res = await assignTask.mutateAsync({ taskId, userId: newAssigneeId });
        await draftService.appendTasks([res], users);
        toast.success('Task reassigned and added to Teams draft batch');
      } else {
        await unassignTask.mutateAsync(taskId);
      }
    } catch (err) {
      console.error('Failed to reassign task:', err);
    }
  };

  const handleDirectUpdateETA = (taskId, newEtaDate, newEtaHours) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;
    const updated = { ...taskObj };
    if (newEtaDate !== undefined) updated.etaDate = newEtaDate ? new Date(newEtaDate).toISOString() : null;
    if (newEtaHours !== undefined) updated.eta = parseFloat(newEtaHours) || 0;
    updateTask.mutate({ id: taskId, data: updated });
  };

  const resolveETARequest = (taskId, approve) => {
    const req = etaExtensions.find(e => e.taskId === taskId && e.status === 'Pending');
    if (!req) return;
    approve ? approveEtaExtension.mutate(req.id) : rejectEtaExtension.mutate(req.id);
  };

  const resolveTransferRequest = (taskId, approve) => {
    const req = taskTransfers.find(t => t.taskId === taskId && t.status === 'Pending');
    if (!req) return;
    approve ? approveTransfer.mutate(req.id) : rejectTransfer.mutate(req.id);
  };

  const [pendingSessionHours, setPendingSessionHours] = useState(0);
  const [pendingSessionProgress, setPendingSessionProgress] = useState(0);

  const handleStartTask = (task) => {
    if (timerState.isClockedIn) { toast.warning("You are currently tracking another task. Please pause or finish it first."); return; }
    updateTask.mutate({ id: task.id, data: { ...task, status: 'In Progress' } });
    clockIn(task.id, task.projectId, task.name, task.type);
    addTaskComment.mutate({
      taskId: task.id,
      authorEmployeeId: currentUser.id,
      commentText: '[Started task tracking]'
    });
  };

  const executePauseOrFinish = async (task, actionType, entryData) => {
    const { date, startTime, duration, workCategory, description, justification } = entryData;

    if (timerState.isClockedIn && timerState.taskId === task.id) {
      cancelTimer();
    }

    if (duration > 0) {
      try {
        await addManualEntry({
          employeeId:currentUser?.id,
          taskId: task.id,
          projectId: task.projectId,
          description: description || `Worked on task: ${task.name}`,
          date: date,
          startTime: startTime,
          duration: duration,
          workCategory: workCategory,
          justification: justification
        });
      } catch (err) {
        console.error("Failed to create timesheet entry", err);
        return; // Don't proceed to change task status if timesheet logging failed
      }
    }

    if(actionType==='pause'){
      updateTask.mutate({
        id:task.id,
        data:{
          ...task,
          status:'Paused',
          etaExceededComment:justification||task.etaExceededComment
        }
      })
    } else if (actionType === 'log') {
      const nextStatus = task.status === 'Open' ? 'In Progress' : task.status;
      updateTask.mutate({
        id:task.id,
        data:{
          ...task,
          status: nextStatus,
          etaExceededComment:justification||task.etaExceededComment
        }
      })
    }else{
      submitTaskReview.mutate({taskId:task.id,justification});
    }

    const actionLabel = actionType === 'pause' ? 'Paused' : (actionType === 'log' ? 'Logged Time' : 'Submitted for Review');
    const commentMsg = justification
      ? `[${actionLabel} - Comment]: ${justification}. Session hours: ${duration}h.`
      : `[${actionLabel}]. Session hours: ${duration}h.`;

    addTaskComment.mutate({
      taskId: task.id,
      authorEmployeeId: currentUser.id,
      commentText: commentMsg
    });

    setExpandedTaskId(null);
  };

  const triggerPauseTask = (task, entryData) => {
    const { duration, justification } = entryData;
    if (duration < 0 || isNaN(duration)) { toast.warning("Please enter valid hours worked."); return; }

    const remainingEta = Math.max(0, task.eta - task.logged);
    const isOverrun = duration > remainingEta;

    if (isOverrun && !justification.trim()) {
      toast.warning("Please provide comments/justification for exceeding the estimated task time.");
      return;
    }

    executePauseOrFinish(task, 'pause', entryData);
  };

  const triggerLogTask = (task, entryData) => {
    const { duration, justification } = entryData;
    if (duration <= 0 || isNaN(duration)) { toast.warning("Please enter valid hours worked."); return; }

    const remainingEta = Math.max(0, task.eta - task.logged);
    const isOverrun = duration > remainingEta;

    if (isOverrun && !justification.trim()) {
      toast.warning("Please provide comments/justification for exceeding the estimated task time.");
      return;
    }

    executePauseOrFinish(task, 'log', entryData);
  };

  const triggerFinishTask = (task, entryData) => {
    const { duration, justification } = entryData;
    if (duration < 0 || isNaN(duration)) { toast.warning("Please enter valid hours worked."); return; }

    const isOverrun=checkTaskExceedsETA({...task,logged:(task.logged||0)});
    const wouldexceedwiththissession=duration>Math.max(0,task.eta-task.logged);
    if ((isOverrun||wouldexceedwiththissession) && !justification.trim()) {
      toast.warning("This task has exceeded its ETA (Date or Hours). Please provide a justification for exceeding the estimated task time.");
      return;
    }

    executePauseOrFinish(task, 'finish', entryData);
  };

  const resolveTaskReview=(taskid,approve,comment='')=>{
    approve? approveTaskReview.mutate({taskid,comment}):rejectTaskReview.mutate({taskid,comment})
  }

  const handleUnsubmitReview=(taskid)=>{
    unsubmitTaskReview.mutate(taskid);
  };

  const handleUndoReview=(taskid)=>{
    undoTaskReview.mutate(taskid);
  }

  const handleDirectSubmitReview = (taskId, justification) => {
    submitTaskReview.mutate({ taskId, justification });
    addTaskComment.mutate({
      taskId,
      authorEmployeeId: currentUser.id,
      commentText: justification
        ? `[Submitted for Review - Comment]: ${justification}`
        : `[Submitted for Review]`
    });
  };

  const handleAddCommentSubmit = (taskId) => {
    const commentText = newComment[taskId];
    if (!commentText || !commentText.trim()) return;
    addTaskComment.mutate({ taskId, authorEmployeeId: currentUser.id, commentText });
    setNewComment(prev => ({ ...prev, [taskId]: '' }));
  };

  const handleEditTaskSubmit = (e) => {
    e.preventDefault();
    if (!editingTask.name || !editingTask.projectId) { toast.warning("Please fill in task name and select a project."); return; }
    editTask(editingTask.id, {
      name: editingTask.name,
      projectId: editingTask.projectId,
      assignedTo: editingTask.assignedTo || '',
      eta: parseFloat(editingTask.eta) || 0,
      type: editingTask.type,
      epic: editingTask.epic || 'Backlog',
      priority: editingTask.priority,
      status: editingTask.status,
      etaDate: editingTask.etaDate || null,
    });
    setShowEditTaskModal(false);
    setEditingTask(null);
  };

  const handleDiscardStaged = () => {
    setStagedTasks([]);
    localStorage.removeItem('erm_staged_tasks');
    toast.success('Staged tasks cleared');
  };

  const handlePublishTasks = async (e) => {
    if (e) e.preventDefault();
    if (!taskData.projectId) { toast.warning("Please select a project."); return; }
    if (stagedTasks.length === 0) { toast.warning("Please stage at least one task."); return; }

    const createdTasks = [];
    try {
      for (const staged of stagedTasks) {
        if (staged.isNew) {
          const res = await createTask.mutateAsync({ name: staged.name, projectId: taskData.projectId, assignedTo: staged.assignedTo, eta: parseFloat(staged.eta) || 8, type: staged.type || 'Story', priority: staged.priority || 'Medium', epic: 'Backlog', taskNumber: staged.taskNumber, etaDate: staged.etaDate, bugNumber: staged.bugNumber });
          createdTasks.push(res);
        } else {
          const backlogTask = tasks.find(t => t.id === staged.backlogTaskId);
          if (backlogTask) {
            const res = await updateTask.mutateAsync({ id: staged.backlogTaskId, data: { ...backlogTask, assignedTo: staged.assignedTo, status: 'Open' } });
            createdTasks.push(res);
          }
        }
      }

      await draftService.appendTasks(createdTasks, users, teamsGroupId, teamsChannelId);
      toast.success('Tasks published and appended to daily Teams draft');
    } catch (err) {
      console.error('Failed to publish tasks:', err);
      toast.error('Failed to publish tasks: ' + (err.message || 'Unknown error'));
    }

    setShowTaskModal(false); setSelectedEmployeeIds([]); setStagedTasks([]); setShowAssignForm(false);
    setTaskData({ name: '', projectId: '', assignedTo: '', eta: '', type: 'Story', epic: 'Backlog', priority: 'Medium' });
    setTeamsGroupId('');
    setTeamsChannelId('');
    localStorage.removeItem('erm_staged_tasks');
    localStorage.removeItem('erm_teams_group_id');
    localStorage.removeItem('erm_teams_channel_id');
  };

  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects
      .filter(p => isAdmin || ledProjectIds.map(id => String(id)).includes(String(p.id)))
      .map(p => ({ value: p.id, label: p.name.split(' (')[0], color: p.color }))
  ];
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...['Open', 'In Progress', 'Pending Review', 'Completed', 'ETA Extended', 'Transferred', 'Rejected'].map(s => ({ value: s, label: s }))
  ];
  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...['Low', 'Medium', 'High', 'Critical'].map(p => ({ value: p, label: p }))
  ];

  const filteredTasks = tasks.filter(t => {
    if (!isAdmin && (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') && scope !== 'backlog') {
      if (!ledMemberIds.has(String(t.assignedTo || '')) && !ledProjectIds.map(id => String(id)).includes(String(t.projectId))) return false;
    }
    if (scope === 'my' && t.assignedTo !== currentUser.id) return false;
    if (scope === 'backlog') {
      if (t.assignedTo && t.assignedTo !== '') return false;
      
      const teamIds = isLeader 
        ? ledTeams.map(team => team.id) 
        : (teams ? teams.filter(team => team.members.includes(currentUser.id)).map(team => team.id) : []);

      if (backlogSubScope === 'team') {
        if (!t.assignedTeamId || !teamIds.map(id => String(id)).includes(String(t.assignedTeamId))) return false;
      } else {
        if (t.assignedTeamId) return false;
        if (currentUser.role === 'Employee') {
          const myProjIds = projects ? projects.filter(p => (p.members || []).some(mId => String(mId) === String(currentUser.id))).map(p => p.id) : [];
          if (!myProjIds.map(id => String(id)).includes(String(t.projectId))) return false;
        }
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const assignee = getUserInfo(t.assignedTo);
      if (!t.name.toLowerCase().includes(q) && !t.taskNumber.toLowerCase().includes(q) && !(assignee && assignee.name.toLowerCase().includes(q))) return false;
    }
    if (selectedProject && t.projectId !== selectedProject) return false;
    if (selectedStatus && t.status !== selectedStatus) return false;
    if (selectedPriority && t.priority !== selectedPriority) return false;
    if (showExceededETA && !checkTaskExceedsETA(t)) return false;
    if (startDateFilter && (!t.etaDate || new Date(t.etaDate) < new Date(startDateFilter + 'T00:00:00'))) return false;
    if (endDateFilter && (!t.etaDate || new Date(t.etaDate) > new Date(endDateFilter + 'T23:59:59'))) return false;
    return true;
  });

  const columns = useMemo(() => [
    {
      accessorKey: 'taskNumber',
      header: 'TASK ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500 whitespace-nowrap">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'TASK NAME',
      cell: ({ row }) => {
        const task = row.original;
        const rejectComment = task.reviewComment || task.rejectionComment;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
            <span className="font-semibold text-sm text-slate-700">{task.name}</span>
            {task.status === 'Pending Review' && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: 'rgba(244,114,182,0.1)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.2)' }}
              >
                Pending Review
              </span>
            )}
            {task.status === 'Rejected' && (
              <span 
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)' }}
                title={rejectComment || 'Needs revision'}
              >
                Rejected{rejectComment ? `: ${rejectComment}` : ' (Needs revision)'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'projectId',
      header: 'PROJECT',
      cell: ({ getValue }) => {
        const proj = getProjectInfo(getValue());
        return (
          <span className="text-sm font-semibold" style={{ color: proj?.color || '#94a3b8' }}>
            {proj ? proj.name.split(' (')[0] : 'General'}
          </span>
        );
      },
    },
    {
      accessorKey: 'assignedTo',
      header: 'ASSIGNEE',
      cell: ({ getValue }) => {
        const assignee = getUserInfo(getValue());
        if (!assignee) return <span className="text-xs text-slate-400 italic">Unassigned</span>;
        return (
          <div className="flex items-center gap-2">
            <UserAvatar name={assignee.name} size={28} />
            <span className="text-sm text-slate-700">{assignee.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      cell: ({ getValue }) => {
        const p = getValue();
        const color = p === 'Critical' ? '#ef4444' : p === 'High' ? '#f59e0b' : p === 'Medium' ? '#3b82f6' : '#94a3b8';
        const bg = p === 'Critical' ? 'rgba(239,68,68,0.1)' : p === 'High' ? 'rgba(245,158,11,0.1)' : p === 'Medium' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)';
        return (
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: '4px', backgroundColor: bg, color }}>
            {p}
          </span>
        );
      },
    },
    {
      accessorKey: 'eta',
      header: 'ESTIMATE / LOGGED',
      cell: ({ row }) => {
        const task = row.original;
        const proj = getProjectInfo(task.projectId);
        const pct = Math.min(100, Math.round((task.logged / task.eta) * 100)) || 0;
        const isOver = task.logged > task.eta;
        return (
          <div className="flex flex-col gap-1" style={{ minWidth: '130px' }}>
            <span className="text-xs" style={{ color: isOver ? '#ef4444' : '#64748b', fontWeight: isOver ? 700 : 400 }}>
              {task.logged}h / {task.eta}h ({pct}%)
            </span>
            <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: isOver ? '#ef4444' : (proj?.color || '#2998ff'), borderRadius: '2px', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'etaDate',
      header: 'DUE DATE',
      cell: ({ getValue, row }) => {
        const val = getValue();
        if (!val) return <span className="text-xs text-slate-400">—</span>;
        const due = new Date(val);
        const now = new Date();
        const isOverdue = due < now && !['Completed', 'Pending Review'].includes(row.original.status);
        const formatted = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return (
          <div className="flex items-center gap-1">
            {isOverdue && <AlertTriangle size={12} color="#ef4444" />}
            <span className="text-xs font-semibold" style={{ color: isOverdue ? '#ef4444' : '#64748b', whiteSpace: 'nowrap' }}>
              {formatted}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex items-center gap-1">
            {task.status === 'Rejected' && <AlertTriangle size={13} color="#eab308" />}
            <span className="text-xs font-bold uppercase" style={{ color: getStatusColor(task.status) }}>
              {task.status}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
            {isLeader && (
              <button
                onClick={(e) => {e.stopPropagation(); setEditingTask(task); setShowEditTaskModal(true); }}
                title="Edit"
                style={{ background: 'color-mix(in oklch, var(--chart-1) 8%, transparent)', border: 'none', color: 'var(--chart-1)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--chart-1) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--chart-1) 8%, transparent)'}
              ><Pencil size={14} /></button>
            )}

            {(isAdmin || isLeader) && (
              <button
                onClick={(e) =>{ 
                  e.stopPropagation();
                  setpendingdeletetask(task)}}
                title="Delete"
                style={{ background: 'color-mix(in oklch, var(--destructive) 8%, transparent)', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--destructive) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--destructive) 8%, transparent)'}
              >
                <Trash2 size={14} />
              </button>
            )}

            {scope !== 'backlog' && task.assignedTo === currentUser.id && !['Completed', 'Pending Review'].includes(task.status) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSubmittingTask(task);
                  setShowSubmitModal(true);
                }}
                title="Submit for Review"
                style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 8%, transparent)'}
              >
                <CheckCircle size={14} /> Submit
              </button>
            )}

            {scope !== 'backlog' && task.assignedTo === currentUser.id && task.status === 'Pending Review' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnsubmitReview(task.id);
                }}
                title="Unsubmit Review"
                style={{ background: 'color-mix(in oklch, var(--destructive) 8%, transparent)', border: 'none', color: 'var(--destructive)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--destructive) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--destructive) 8%, transparent)'}
              >
                <ChevronUp size={14} /> Unsubmit
              </button>
            )}

            {scope !== 'backlog' && (isAdmin || ledMemberIds.has(String(task.assignedTo))) && (task.completionReviewStatus === 'APPROVED' || task.completionReviewStatus === 'REJECTED') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUndoReview(task.id);
                }}
                title="Undo Decision"
                style={{ background: 'color-mix(in oklch, var(--secondary) 15%, transparent)', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--secondary) 25%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--secondary) 15%, transparent)'}
              >
                <RotateCcw size={14} /> Undo
              </button>
            )}

            {scope === 'backlog' && backlogSubScope === 'team' && isLeader && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDelegatingTask(task);
                  setShowDelegateModal(true);
                }}
                title="Delegate Task"
                style={{ background: 'color-mix(in oklch, var(--primary) 8%, transparent)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 8%, transparent)'}
              >
                Delegate
              </button>
            )}

            {scope === 'backlog' && backlogSubScope === 'general' && !isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();

                  setpendingclaimtask(task)}}
                title="Claim Task"
                style={{ background: 'color-mix(in oklch, #22c55e 8%, transparent)', border: 'none', color: '#22c55e', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700 }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, #22c55e 15%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, #22c55e 8%, transparent)'}
              ><Plus size={14} /> Claim</button>
            )}
          </div>
        );
      },
    },
  ], [projects, users, isAdmin, isLeader, scope]);

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading tasks...</div>;
  return (
    <div className="tasks-page-container">
      <div className="tasks-toolbar-wrapper">

        <div>
          <button
            className="mobile-filter-toggle-btn"
            onClick={() => setIsFiltersExpanded(prev => !prev)}
          >
            <Filter size={14} /> {isFiltersExpanded ? "Hide Filters" : "Show Filters"}
          </button>
          <div className={`tasks-filter-card ${isFiltersExpanded ? 'mobile-filters-open' : ''}`}>
            <div className="tasks-filter-row" style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%' }}>
              <div className="flex items-center gap-2 flex-shrink-1 min-w-0" style={{ flexWrap: 'nowrap' }}>
                <div className="tasks-search-box" style={{ width: '160px', flexShrink: 1 }}>
                  <Search size={14} className="tasks-search-icon" />
                  <input
                    type="text"
                    placeholder="Search "
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="tasks-search-input"
                  />
                </div>

                <div className="flex items-center">
                  <SearchableSelect
                    options={projectOptions}
                    value={selectedProject}
                    onChange={setSelectedProject}
                    placeholder="All Projects"
                    style={{ width: '140px' }}
                  />
                </div>

                <div className="flex items-center">
                  <SearchableSelect
                    options={statusOptions}
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    placeholder="All Statuses"
                    style={{ width: '130px' }}
                  />
                </div>

                <div className="flex items-center">
                  <SearchableSelect
                    options={priorityOptions}
                    value={selectedPriority}
                    onChange={setSelectedPriority}
                    placeholder="All Priorities"
                    style={{ width: '130px' }}
                  />
                </div>

                <button
                  onClick={() => setShowExceededETA(!showExceededETA)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                    showExceededETA
                      ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                      : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle size={13} className={showExceededETA ? 'text-red-500' : 'text-slate-400'} />
                  Exceeded ETA
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Start:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    style={{
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)'
                    }}
                  />
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider ml-1">End:</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    style={{
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0" style={{ marginLeft: 'auto', flexWrap: 'nowrap' }}>
                <div className="tasks-scope-toggle" style={{ flexWrap: 'nowrap' }}>
                  {isLeader && (
                    <button onClick={() => setScope('all')} className={`tasks-scope-btn ${scope === 'all' ? 'active' : 'inactive'}`}>
                      All Team Tasks
                    </button>
                  )}
                  {!isAdmin && (
                    <button onClick={() => setScope('my')} className={`tasks-scope-btn ${scope === 'my' ? 'active' : 'inactive'}`}>
                      My Tasks
                    </button>
                  )}
                  <button onClick={() => setScope('backlog')} className={`tasks-scope-btn ${scope === 'backlog' ? 'active' : 'inactive'}`}>
                    Backlog Tasks
                  </button>
                </div>

                {isLeader && (
                  <>
                    <button
                      className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition border border-slate-200 bg-white whitespace-nowrap flex items-center gap-1.5"
                      onClick={() => setShowTeamsDraftModal(true)}
                    >
                      <Send size={13} /> View Teams Draft
                    </button>
                    <button
                      className="rounded-xl px-4 py-2 text-xs font-bold text-white transition tasks-create-btn whitespace-nowrap"
                      style={{ backgroundColor: '#0010ae' }}
                      onClick={() => setShowTaskModal(true)}
                    >
                      <Plus size={13} /> Create Task
                    </button>
                  </>
                )}
              </div>
            </div>

            {(searchQuery || selectedProject || selectedStatus || selectedPriority || startDateFilter || endDateFilter) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedProject(''); setSelectedStatus(''); setSelectedPriority(''); setStartDateFilter(''); setEndDateFilter(''); }}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {scope === 'backlog' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', padding: '0 0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => setBacklogSubScope('general')}
              className={`tasks-scope-btn ${backlogSubScope === 'general' ? 'active' : 'inactive'}`}
              style={{ fontSize: '0.72rem', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              General Backlog
            </button>
            <button
              onClick={() => setBacklogSubScope('team')}
              className={`tasks-scope-btn ${backlogSubScope === 'team' ? 'active' : 'inactive'}`}
              style={{ fontSize: '0.72rem', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              Team Backlog Plan
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
          <DataTable
            Data={filteredTasks}
            columns={columns}
            onRowClick={(task) => setExpandedTaskId(task.id)}
            getRowClassName={(task) => task.id === highlightTaskId ? 'glow-highlight' : ''}
          />
        </div>

        <DelegateTaskModal
          show={showDelegateModal}
          onClose={() => { setShowDelegateModal(false); setDelegatingTask(null); }}
          task={delegatingTask}
          teamMembers={(() => {
            if (!delegatingTask || !teams) return [];
            const team = teams.find(t => String(t.id) === String(delegatingTask.assignedTeamId));
            if (!team) return [];
            return users.filter(u => team.members.includes(u.id));
          })()}
          onSubmit={handleDelegateSubmit}
        />

        <ETAExtensionModal
          show={showETAModal}
          onClose={() => setShowETAModal(false)}
          onSubmit={handleETASubmit}
          etaDate={etaDate}
          setEtaDate={setEtaDate}
          etaReason={etaReason}
          setEtaReason={setEtaReason}
        />
        <TransferModal
          show={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSubmit={handleTransferSubmit}
          users={users}
          currentUser={currentUser}
          transferTarget={transferTarget}
          setTransferTarget={setTransferTarget}
          transferReason={transferReason}
          setTransferReason={setTransferReason}
        />
        <EditTaskModal
          show={showEditTaskModal}
          onClose={() => { setShowEditTaskModal(false); setEditingTask(null); }}
          onSubmit={handleEditTaskSubmit}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          projects={projects}
          users={users}
          isAdmin={isAdmin}
          ledProjectIds={ledProjectIds}
          getDatetimeInputValue={getDatetimeInputValue}
        />
        <CreateTaskModal
          show={showTaskModal}
          onClose={() => { setShowTaskModal(false); setShowAssignForm(false); setShowBacklogDropdown(false); }}
          onSubmit={handlePublishTasks}
          projects={projects}
          tasks={tasks}
          users={users}
          isAdmin={isAdmin}
          ledProjectIds={ledProjectIds}
          taskData={taskData}
          setTaskData={setTaskData}
          stagedTasks={stagedTasks}
          setStagedTasks={setStagedTasks}
          assignForm={assignForm}
          setAssignForm={setAssignForm}
          showAssignForm={showAssignForm}
          setShowAssignForm={setShowAssignForm}
          showBacklogDropdown={showBacklogDropdown}
          setShowBacklogDropdown={setShowBacklogDropdown}
          onDiscardDraft={handleDiscardStaged}
          teamsGroupId={teamsGroupId}
          setTeamsGroupId={setTeamsGroupId}
          teamsChannelId={teamsChannelId}
          setTeamsChannelId={setTeamsChannelId}
          teams={teams}
          currentUser={currentUser}
        />
        <TeamsDraftModal
          show={showTeamsDraftModal}
          onClose={() => setShowTeamsDraftModal(false)}
          users={users}
        />
        <TaskDetailPanel
          show={!!expandedTaskId}
          onClose={() => setExpandedTaskId(null)}
          task={tasks.find(t => t.id === expandedTaskId)}
          currentUser={currentUser}
          users={users}
          projects={projects}
          timerState={timerState}
          isAdmin={isAdmin}
          isLeader={isLeader}
          ledProjectIds={ledProjectIds}
          ledMemberIds={ledMemberIds}
          etaExtensions={etaExtensions}
          taskTransfers={taskTransfers}
          newComment={newComment}
          setNewComment={setNewComment}
          onStartTask={handleStartTask}
          onTriggerPause={triggerPauseTask}
          onTriggerFinish={triggerFinishTask}
          onTriggerLog={triggerLogTask}
          onAddComment={handleAddCommentSubmit}
          onOpenETA={(id) => { setActiveTaskId(id); setShowETAModal(true); }}
          onOpenTransfer={(id) => { setActiveTaskId(id); setShowTransferModal(true); }}
          onResolveETA={resolveETARequest}
          onResolveTransfer={resolveTransferRequest}
          onResolveReview={resolveTaskReview}
          onUnsubmitReview={handleUnsubmitReview}
          onUndoReview={handleUndoReview}
          onDirectReassign={handleDirectReassign}
          onDirectUpdateETA={handleDirectUpdateETA}
          onEditTask={(task) => { setEditingTask(task); setShowEditTaskModal(true); }}
          onDeleteTask={(id) => removeTask.mutate({ id })}
          claimBacklogTask={claimBacklogTask}
          requestClaimBacklogTask={requestClaimBacklogTask}
          getStatusColor={getStatusColor}
          checkTaskExceedsETA={checkTaskExceedsETA}
          getDatetimeInputValue={getDatetimeInputValue}
        />
      </div>
      <ConfirmDialog
      isOpen={!!pendingdeletetask}
      onClose={()=>setpendingdeletetask(null)}
      onConfirm={()=>{
        if(pendingdeletetask){
          removeTask.mutate({id:pendingdeletetask.id});

        }
        setpendingdeletetask(null);
      }}
      title="Delete Task"
      message={`Are you sure you want to delete task "${pendingdeletetask?.name}"?`}
      />
      <ConfirmDialog
      isOpen={!!pendingclaimtask}
      onClose={()=>setpendingclaimtask(null)}
      onConfirm={()=>{
        if(pendingclaimtask){
          if(isLeader){
            claimBacklogTask(pendingclaimtask.id)
          }else{
            requestClaimBacklogTask(pendingclaimtask.id);
          }
        }
        setpendingclaimtask(null)
      }}
      title="Claim Task"
      message={`Are you sure you want to claim task "${pendingclaimtask?.name}"?`}
      />
      <SubmitReviewModal
        show={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); setSubmittingTask(null); }}
        task={submittingTask}
        onSubmit={handleDirectSubmitReview}
        checkTaskExceedsETA={checkTaskExceedsETA}
      />
    </div>
  );
}

function DelegateTaskModal({ show, onClose, task, teamMembers, onSubmit }) {
  const [selectedMember, setSelectedMember] = useState('');

  if (!show || !task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>Delegate Task</h3>
          <button className="modal-close" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}>×</button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (selectedMember) {
            onSubmit(task.id, selectedMember);
            onClose();
          }
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Select Team Member</label>
            <select 
              className="input-control" 
              value={selectedMember} 
              onChange={e => setSelectedMember(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
            >
              <option value="">-- Choose Member --</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.designation || 'Member'})</option>
              ))}
            </select>
          </div>
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0010AE', color: '#ffffff', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Delegate Task</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmitReviewModal({ show, onClose, task, onSubmit, checkTaskExceedsETA }) {
  const [justification, setJustification] = useState('');
  
  if (!show || !task) return null;

  const isEtaExceeded = checkTaskExceedsETA(task);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEtaExceeded && !justification.trim()) {
      return;
    }
    onSubmit(task.id, justification);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div 
        className="modal-content liquid-glass-card" 
        style={{ maxWidth: '450px', width: '100%', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>Submit Task for Review</h3>
          <button className="modal-close" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
              Are you sure you want to submit the task <strong style={{ color: 'var(--foreground)' }}>"{task.name}"</strong> for review?
            </p>
          </div>

          {isEtaExceeded && (
            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.75rem' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontWeight: 'bold' }}>ETA Exceeded Alert: </span>
                This task has exceeded its estimated hours or due date. Please provide a justification below to proceed with submission.
              </div>
            </div>
          )}

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
              {isEtaExceeded ? 'Over-ETA Justification (Required)' : 'Comments / Notes (Optional)'}
            </label>
            <textarea
              className="form-input text-xs"
              placeholder={isEtaExceeded ? "Explain why the task exceeded the estimate..." : "Any notes for the reviewer..."}
              value={justification}
              onChange={e => setJustification(e.target.value)}
              required={isEtaExceeded}
              rows="3"
              style={{ width: '100%', resize: 'none', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Submit for Review</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamsDraftModal({ show, onClose, users }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const toast = useToast();

  const fetchDraft = async () => {
    setLoading(true);
    try {
      const res = await api.get('/task-drafts');
      if (res && res.teamsMessage) {
        setDraft(res);
      } else {
        setDraft(null);
      }
    } catch (err) {
      console.warn("Failed to load today's Teams draft:", err);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (show) {
      fetchDraft();
    }
  }, [show]);

  const handleSend = async () => {
    setSending(true);
    try {
      await draftService.sendDraftToTeams();
      toast.success("Draft sent to Teams successfully");
      onClose();
    } catch (err) {
      toast.error("Failed to send draft: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      await draftService.deleteDrafts();
      toast.success("Draft discarded successfully");
      onClose();
    } catch (err) {
      toast.error("Failed to discard draft: " + (err.message || "Unknown error"));
    } finally {
      setDiscarding(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div 
        className="modal-content liquid-glass-card" 
        style={{ maxWidth: '600px', width: '100%', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <h3 className="modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>Today's Teams Draft Batch</h3>
          <button className="modal-close" onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}>&times;</button>
        </div>
        
        <div style={{ minHeight: '150px', maxHeight: '350px', overflowY: 'auto', marginBottom: '1rem', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', color: 'var(--muted-foreground)' }}>
              Loading draft...
            </div>
          ) : draft ? (
            <div 
              style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--foreground)' }}
              dangerouslySetInnerHTML={{ __html: draft.teamsMessage.replace(/<!--DRAFT_METADATA:(.*?)-->/, '') }} 
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '150px', color: 'var(--muted-foreground)', gap: '8px' }}>
              <span>No open draft batch exists for today.</span>
              <span style={{ fontSize: '0.75rem' }}>Newly created or assigned tasks will automatically accumulate here.</span>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose} 
            style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', color: 'var(--text-secondary)' }}
          >
            Close
          </button>
          
          {draft && (
            <>
              <button 
                type="button" 
                onClick={handleDiscard}
                disabled={discarding || sending}
                style={{ padding: '0.45rem 1rem', borderRadius: '8px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {discarding ? 'Discarding...' : 'Discard Draft'}
              </button>
              
              <button 
                type="button" 
                onClick={handleSend}
                disabled={discarding || sending}
                style={{ backgroundColor: '#0010AE', color: '#ffffff', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {sending ? 'Sending...' : 'Send to Teams'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

