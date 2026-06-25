import React, { useState, useMemo } from 'react';
import { Plus, Search, AlertTriangle, Filter, Pencil, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useTasks } from '../../hooks/useTasks';
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
  const { currentUser, projects, users, timerState, clockIn, clockOut, cancelTimer, teams, etaExtensions, taskTransfers, addManualEntry, claimBacklogTask, requestClaimBacklogTask } = useApp();

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showExceededETA, setShowExceededETA] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
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

  const location = useLocation();
  const [highlightTaskId, setHighlightTaskId] = useState(null);

  React.useEffect(() => {
    if (location.state?.highlightTaskId) {
      const taskId = location.state.highlightTaskId;
      setHighlightTaskId(taskId);
      
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

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!activeTaskId || !transferTarget || !transferReason) return;
    createTransfer.mutate({ taskId: activeTaskId, fromEmployeeId: currentUser.id, toEmployeeId: transferTarget, reason: transferReason });
    setShowTransferModal(false);
  };

  const handleDirectReassign = (taskId, newAssigneeId) => {
    if (newAssigneeId) {
      assignTask.mutate({ taskId, userId: newAssigneeId });
    } else {
      unassignTask.mutate(taskId);
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
    if (timerState.isClockedIn) { alert("You are currently tracking another task. Please pause or finish it first."); return; }
    updateTask.mutate({ id: task.id, data: { ...task, status: 'In Progress' } });
    clockIn(task.id, task.projectId, task.name, task.type);
    addTaskComment.mutate({
      taskId: task.id,
      authorEmployeeId: currentUser.id,
      commentText: '[Started task tracking]'
    });
  };

  const executePauseOrFinish = (task, actionType, entryData) => {
    const { date, startTime, duration, workCategory, description, justification } = entryData;

    if (timerState.isClockedIn && timerState.taskId === task.id) {
      cancelTimer();
    }

    if (duration > 0) {
      addManualEntry({
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
    }else{
      submitTaskReview.mutate({taskId:task.id,justification});
    }

    

    const commentMsg = justification
      ? `[${actionType === 'pause' ? 'Paused' : 'Submitted for Review'} - Comment]: ${justification}. Session hours: ${duration}h.`
      : `[${actionType === 'pause' ? 'Paused' : 'Submitted for Review'}]. Session hours: ${duration}h.`;

    addTaskComment.mutate({
      taskId: task.id,
      authorEmployeeId: currentUser.id,
      commentText: commentMsg
    });

    setExpandedTaskId(null);
  };

  const triggerPauseTask = (task, entryData) => {
    const { duration, justification } = entryData;
    if (duration < 0 || isNaN(duration)) { alert("Please enter valid hours worked."); return; }

    const remainingEta = Math.max(0, task.eta - task.logged);
    const isOverrun = duration > remainingEta;

    if (isOverrun && !justification.trim()) {
      alert("Please provide comments/justification for exceeding the estimated task time.");
      return;
    }

    executePauseOrFinish(task, 'pause', entryData);
  };

  const triggerFinishTask = (task, entryData) => {
    const { duration, justification } = entryData;
    if (duration < 0 || isNaN(duration)) { alert("Please enter valid hours worked."); return; }

    const isOverrun=checkTaskExceedsETA({...task,logged:(task.logged||0)});
    const wouldexceedwiththissession=duration>Math.max(0,task.eta-task.logged);
    if ((isOverrun||wouldexceedwiththissession) && !justification.trim()) {
      alert("This task has exceeded its ETA (Date or Hours).Please provide a justification for exceeding theestimated task time.");
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

  const handleAddCommentSubmit = (taskId) => {
    const commentText = newComment[taskId];
    if (!commentText || !commentText.trim()) return;
    addTaskComment.mutate({ taskId, authorEmployeeId: currentUser.id, commentText });
    setNewComment(prev => ({ ...prev, [taskId]: '' }));
  };

  const handleEditTaskSubmit = (e) => {
    e.preventDefault();
    if (!editingTask.name || !editingTask.projectId) { alert("Please fill in task name and select a project."); return; }
    updateTask.mutate({ id: editingTask.id, data: { name: editingTask.name, projectId: editingTask.projectId, assignedTo: editingTask.assignedTo || '', eta: parseFloat(editingTask.eta) || 0, type: editingTask.type, epic: editingTask.epic || 'Backlog', priority: editingTask.priority, status: editingTask.status } });
    setShowEditTaskModal(false); setEditingTask(null);
  };

  const handlePublishTasks = (e) => {
    if (e) e.preventDefault();
    if (!taskData.projectId) { alert("Please select a project."); return; }
    if (stagedTasks.length === 0) { alert("Please stage at least one task."); return; }
    stagedTasks.forEach(staged => {
      if (staged.isNew) {
        createTask.mutate({ name: staged.name, projectId: taskData.projectId, assignedTo: staged.assignedTo, eta: parseFloat(staged.eta) || 8, type: staged.type || 'Story', priority: staged.priority || 'Medium', epic: 'Backlog', taskNumber: staged.taskNumber, etaDate: staged.etaDate, bugNumber: staged.bugNumber });
      } else {
        const backlogTask = tasks.find(t => t.id === staged.backlogTaskId);
        if (backlogTask) {
          updateTask.mutate({ id: staged.backlogTaskId, data: { ...backlogTask, assignedTo: staged.assignedTo, status: 'Open' } });
        }
      }
    });
    setShowTaskModal(false); setSelectedEmployeeIds([]); setStagedTasks([]); setShowAssignForm(false);
    setTaskData({ name: '', projectId: '', assignedTo: '', eta: '', type: 'Story', epic: 'Backlog', priority: 'Medium' });
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
      if (currentUser.role === 'Employee') {
        const myProjIds = projects ? projects.filter(p => (p.members || []).some(mId => String(mId) === String(currentUser.id))).map(p => p.id) : [];
        if (!myProjIds.map(id => String(id)).includes(String(t.projectId))) return false;
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

            {scope === 'backlog' && !isAdmin && (
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
                  <button
                    className="rounded-xl px-4 py-2 text-xs font-bold text-white transition tasks-create-btn whitespace-nowrap"
                    style={{ backgroundColor: '#0010ae' }}
                    onClick={() => setShowTaskModal(true)}
                  >
                    <Plus size={13} /> Create Task
                  </button>
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

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
          <DataTable
            Data={filteredTasks}
            columns={columns}
            onRowClick={(task) => setExpandedTaskId(task.id)}
            getRowClassName={(task) => task.id === highlightTaskId ? 'glow-highlight' : ''}
          />
        </div>

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
        />
        <CreateTaskModal
          show={showTaskModal}
          onClose={() => { setShowTaskModal(false); setStagedTasks([]); setShowAssignForm(false); setShowBacklogDropdown(false); }}
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
    </div>
  );
}
