import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth as useAuthContext } from './AuthContext';

import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';

import { useEmployees } from '../hooks/useEmployees';
import { useTeams } from '../hooks/useTeams';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';

import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import { useNotifications } from '../hooks/useNotifications';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useMeetings } from '../hooks/useMeetings';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useETAExtensions } from '../hooks/useETAExtensions';
import { useTaskTransfers } from '../hooks/useTaskTransfers';
import { useAttendance } from '../hooks/useAttendance';
import { useAdminSettings } from '../hooks/useAdminSettings';

// Helper: Convert hex to HSL
function hexToHsl(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper: Convert HSL to Hex
function hslToHex(h, s, l) {
  l /= 100;
  let a = s * Math.min(l, 1 - l) / 100;
  let f = n => {
    let k = (n + h / 30) % 12;
    let color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper: Adjust project colors for better contrast based on theme
function getAdjustedProjectColor(hex, theme) {
  if (!hex || typeof hex !== 'string') return '#0010AE';
  try {
    const { h, s, l } = hexToHsl(hex);
    if (theme === 'dark') {
      const newL = Math.max(l, 70);
      const newS = Math.max(s, 60);
      return hslToHex(h, newS, newL);
    } else {
      let targetL = 40;
      let targetS = s;
      if (h >= 35 && h <= 70) {
        targetL = 32;
        targetS = Math.min(Math.max(s, 85), 100);
      } else if (h > 70 && h <= 150) {
        targetL = 35;
        targetS = Math.min(Math.max(s, 75), 100);
      } else {
        targetL = 42;
        targetS = Math.min(Math.max(s, 70), 95);
      }
      const newL = Math.min(l, targetL);
      return hslToHex(h, targetS, newL);
    }
  } catch (e) {
    console.error("Error adjusting project color:", hex, e);
    return hex;
  }
}

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState('light');

  // Zoom State
  const [pageZoom, setPageZoom] = useState(() => {
    return parseFloat(localStorage.getItem('page-zoom') || '0.9');
  });

  useEffect(() => {
    localStorage.setItem('page-zoom', pageZoom.toString());
    document.documentElement.style.setProperty('--page-zoom', pageZoom.toString());
  }, [pageZoom]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // 1. Fetch Real Context Auth variables to sync
  const { user: authUser, isAuthenticated: authIsAuthenticated } = useAuthContext();

  // 2. Fetch Query base hooks
  const employeesQuery = useEmployees({ enabled: authIsAuthenticated });
  const { employees: rawUsers, isLoading: employeesLoading, error: employeesError, createEmployee: mutateCreateEmployee, updateEmployee: mutateUpdateEmployee, removeEmployee: mutateRemoveEmployee } = employeesQuery;
  
  const teamsQuery = useTeams({ enabled: authIsAuthenticated });
  const { teams, createTeam: mutateCreateTeam, updateTeam: mutateUpdateTeam, removeTeam: mutateRemoveTeam, addTeamMember: mutateAddTeamMember, removeTeamMember: mutateRemoveTeamMember } = teamsQuery;

  const projectsQuery = useProjects({ enabled: authIsAuthenticated });
  const { projects, createProject: mutateCreateProject, updateProject: mutateUpdateProject, removeProject: mutateRemoveProject, addProjectMember: mutateAddProjectMember, removeProjectMember: mutateRemoveProjectMember } = projectsQuery;

  const tasksQuery = useTasks({ enabled: authIsAuthenticated });
  const { tasks, createTask: mutateCreateTask, updateTask: mutateUpdateTask, removeTask: mutateRemoveTask, assignTask: mutateAssignTask, addTaskComment: mutateAddTaskComment, updateTaskProgress: mutateUpdateTaskProgress } = tasksQuery;

  // 3. Compute derived users list
  const users = useMemo(() => {
    if (!rawUsers || !teams) return [];
    let changed = false;
    const nextUsers = rawUsers.map(user => {
      const isLeadAnyTeam = teams.some(t => String(t.leadId) === String(user.id));
      const isSubLeadAnyTeam = teams.some(t => String(t.subLeadId) === String(user.id));
      const targetRole = isLeadAnyTeam ? 'Team Lead' : (isSubLeadAnyTeam ? 'Sub Lead' : 'Employee');
      if (user.role === 'Admin') return user;
      if (user.role !== targetRole) {
        changed = true;
        return { ...user, role: targetRole };
      }
      return user;
    });
    return changed ? nextUsers : rawUsers;
  }, [rawUsers, teams]);

  // 4. Initialize domain hooks
  const notificationsHook = useNotifications();
  const handleAddNotification = notificationsHook.addNotification;

  const attendanceHook = useAttendance({
    currentUser: authUser,
    enabled: authIsAuthenticated
  });

  const cancelTimerRef = useRef(null);
  const handleLogout = useCallback(() => {
    if (cancelTimerRef.current) {
      cancelTimerRef.current();
    }
  }, []);

  const handleLoginSuccess = useCallback((user) => {
    attendanceHook.autoClockInOnLogin(user);
  }, [attendanceHook]);

  const auth = useAuth(users, {
    onLoginSuccess: handleLoginSuccess,
    onLogout: handleLogout,
    authUser,
    authIsAuthenticated
  });

  // Timer callbacks
  const handleClockIn = useCallback((taskId, projectId, description, workCategory, now) => {
    attendanceHook.clockInAttendance(auth.currentUser?.id);
  }, [attendanceHook, auth.currentUser?.id]);

  const handleToggleBreak = useCallback((isBreakStart, now, diffMinutes, breakEnd, breakStart) => {
    attendanceHook.toggleBreakAttendance(auth.currentUser?.id, isBreakStart, now, diffMinutes, breakEnd, breakStart);
  }, [attendanceHook, auth.currentUser?.id]);

  const handleClockOut = useCallback((timerState, durationHours, displayEndTime, justification) => {
    const checkInTime = new Date(timerState.startTime);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const newEntry = {
      id: `entry-${Date.now()}`,
      userId: auth.currentUser?.id,
      taskId: timerState.taskId,
      projectId: timerState.projectId,
      description: timerState.description,
      date: todayStr,
      startTime: checkInTime.toTimeString().slice(0, 5),
      endTime: displayEndTime.toTimeString().slice(0, 5),
      duration: durationHours.toString(),
      status: 'Pending',
      workCategory: timerState.workCategory,
      justification
    };

    // Save locally
    timeEntriesHook.setTimeEntries(prev => [newEntry, ...prev]);

    // Update task status on backend if status is Open
    const activeTaskObj = tasks.find(t => t.id === timerState.taskId);
    if (activeTaskObj && activeTaskObj.status === 'Open') {
      mutateUpdateTask.mutateAsync({
        id: timerState.taskId,
        data: { ...activeTaskObj, status: 'In Progress' }
      }).catch(err => console.error("Failed to update task status on clockOut:", err));
    }

    // Update Attendance clockOut
    attendanceHook.clockOutAttendance(auth.currentUser?.id, displayEndTime);

    // Check for late notifications / ETA alerts
    if (activeTaskObj && activeTaskObj.etaDate && new Date() > new Date(activeTaskObj.etaDate)) {
      handleAddNotification({
        id: `notif-${Date.now()}`,
        recipientId: auth.currentUser?.id,
        type: "TASK_UPDATED",
        title: "Task Over ETA Warning",
        message: `Your task TASK-0042 is past its scheduled ETA date. Please request an extension.`,
        entityType: "TASK",
        entityId: timerState.taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }, [auth.currentUser?.id, tasks, mutateUpdateTask, attendanceHook, handleAddNotification]);

  const timerHook = useTimer({
    onClockIn: handleClockIn,
    onToggleBreak: handleToggleBreak,
    onClockOut: handleClockOut
  });

  cancelTimerRef.current = timerHook.cancelTimer;

  // Time entries callbacks
  const handleUpdateTaskStatus = useCallback(async (taskId, status, comment = '') => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;
    try {
      const updatedData = { ...taskObj, status };
      if (status === 'Rejected') {
        updatedData.rejectionComment = comment;
      }
      await mutateUpdateTask.mutateAsync({ id: taskId, data: updatedData });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  }, [tasks, mutateUpdateTask]);

  const timeEntriesHook = useTimeEntries({
    currentUser: auth.currentUser,
    tasks,
    users,
    teams,
    onUpdateTaskStatus: handleUpdateTaskStatus,
    onAddNotification: handleAddNotification,
    enabled: auth.isAuthenticated
  });

  const meetingsHook = useMeetings({
    currentUser: auth.currentUser,
    onAddNotification: handleAddNotification,
    enabled: auth.isAuthenticated
  });

  const announcementsHook = useAnnouncements({
    currentUser: auth.currentUser,
    users,
    onAddNotification: handleAddNotification
  });

  // Task updater for extensions
  const handleUpdateTaskETA = useCallback(async (taskId, updatedData) => {
    await mutateUpdateTask.mutateAsync({ id: taskId, data: updatedData });
  }, [mutateUpdateTask]);

  const etaExtensionsHook = useETAExtensions({
    currentUser: auth.currentUser,
    tasks,
    users,
    onUpdateTask: handleUpdateTaskETA,
    onAddNotification: handleAddNotification
  });

  const handleUpdateTaskTransfer = useCallback(async (taskId, updatedData) => {
    await mutateUpdateTask.mutateAsync({ id: taskId, data: updatedData });
  }, [mutateUpdateTask]);

  const taskTransfersHook = useTaskTransfers({
    currentUser: auth.currentUser,
    tasks,
    users,
    onUpdateTask: handleUpdateTaskTransfer,
    onAddNotification: handleAddNotification
  });

  const adminSettingsHook = useAdminSettings();

  // Derived Memos
  const adjustedProjects = useMemo(() => projects.map(proj => ({
    ...proj,
    color: getAdjustedProjectColor(proj.color, theme)
  })), [projects, theme]);

  const tasksWithLoggedHours = useMemo(() => tasks.map(t => {
    const taskEntries = timeEntriesHook.timeEntries.filter(e => String(e.taskId) === String(t.id));
    const sessionLogged = taskEntries.filter(e => e.status !== 'Rejected').reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
    const logged = (t.logged || 0) + sessionLogged;
    return { ...t, logged: parseFloat(logged.toFixed(2)) };
  }), [tasks, timeEntriesHook.timeEntries]);

  const taskComments = useMemo(() => {
    if (!tasks) return [];
    return tasks.flatMap(t => 
      (t.comments || []).map(c => ({
        id: c.id,
        taskId: t.id,
        authorId: c.author?.id || null,
        commentText: c.commentText,
        createdAt: c.createdAt
      }))
    );
  }, [tasks]);

  const taskCommentsMap = useMemo(() => {
    const map = {};
    taskComments.forEach(c => {
      if (!map[c.taskId]) {
        map[c.taskId] = [];
      }
      map[c.taskId].push({
        id: c.id,
        userId: c.authorId,
        text: c.commentText,
        timestamp: c.createdAt
      });
    });
    return map;
  }, [taskComments]);

  // Project orchestrators
  const createProject = useCallback(async (projData) => {
    try {
      const created = await mutateCreateProject.mutateAsync(projData);
      if (projData.members && projData.members.length > 0) {
        for (const memberId of projData.members) {
          await mutateAddProjectMember.mutateAsync({ projectId: created.id, userId: memberId });
        }
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project: ' + err.message);
    }
  }, [mutateCreateProject, mutateAddProjectMember]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await mutateRemoveProject.mutateAsync(projectId);
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project: ' + err.message);
    }
  }, [mutateRemoveProject]);

  const createTask = useCallback(async (taskData) => {
    try {
      const created = await mutateCreateTask.mutateAsync(taskData);
      const assignee = users.find(u => u.id === created.assignedTo);
      if (assignee) {
        handleAddNotification({
          id: `notif-${Date.now()}`,
          recipientId: assignee.id,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You have been assigned ${created.taskNumber}: ${created.name} by ${auth.currentUser?.name}.`,
          entityType: "TASK",
          entityId: created.id,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task: ' + err.message);
    }
  }, [mutateCreateTask, users, auth.currentUser?.name, handleAddNotification]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await mutateRemoveTask.mutateAsync(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task: ' + err.message);
    }
  }, [mutateRemoveTask]);

  const addEmployee = useCallback(async (empData) => {
    try {
      const created = await mutateCreateEmployee.mutateAsync(empData);
      const userId = created?.id;
      if (userId) {
        const targetTeams = empData.teams || [];
        const targetProjects = empData.projects || [];
        await Promise.all([
          ...targetTeams.map(teamId => mutateAddTeamMember.mutateAsync({ teamId, userId })),
          ...targetProjects.map(projectId => mutateAddProjectMember.mutateAsync({ projectId, userId }))
        ]);
      }
    } catch (err) {
      console.error('Failed to add employee:', err);
      throw err;
    }
  }, [mutateCreateEmployee, mutateAddTeamMember, mutateAddProjectMember]);

  const deleteEmployee = useCallback(async (userId, reason = 'Removed by admin') => {
    if (userId === auth.currentUser?.id) return;
    try {
      await mutateRemoveEmployee.mutateAsync({ id: userId, reason });
    } catch (err) {
      console.error('Failed to delete employee:', err);
      throw err;
    }
  }, [auth.currentUser?.id, mutateRemoveEmployee]);

  const createTeam = useCallback(async (teamData) => {
    try {
      const created = await mutateCreateTeam.mutateAsync(teamData);
      if (teamData.leadId) {
        const leadUser = rawUsers.find(u => String(u.id) === String(teamData.leadId));
        if (leadUser && leadUser.role !== 'Team Lead' && leadUser.role !== 'Admin') {
          await mutateUpdateEmployee.mutateAsync({ id: leadUser.id, data: { ...leadUser, role: 'Team Lead' } });
        }
      }
      if (teamData.members && teamData.members.length > 0) {
        for (const memberId of teamData.members) {
          await mutateAddTeamMember.mutateAsync({ teamId: created.id, userId: memberId });
        }
      }
    } catch (err) {
      console.error('Failed to create team:', err);
      alert('Failed to create team: ' + err.message);
    }
  }, [mutateCreateTeam, rawUsers, mutateUpdateEmployee, mutateAddTeamMember]);

  const deleteTeam = useCallback(async (teamId) => {
    try {
      await mutateRemoveTeam.mutateAsync(teamId);
    } catch (err) {
      console.error('Failed to delete team:', err);
      alert('Failed to delete team: ' + err.message);
    }
  }, [mutateRemoveTeam]);

  const editTeam = useCallback(async (teamId, updatedData) => {
    try {
      await mutateUpdateTeam.mutateAsync({ id: teamId, data: updatedData });
      if (updatedData.leadId) {
        const leadUser = rawUsers.find(u => String(u.id) === String(updatedData.leadId));
        if (leadUser && leadUser.role !== 'Team Lead' && leadUser.role !== 'Admin') {
          await mutateUpdateEmployee.mutateAsync({ id: leadUser.id, data: { ...leadUser, role: 'Team Lead' } });
        }
      }
      const existingMembers = await teamService.getMembers(teamId);
      const existingIds = existingMembers.map(m => m.id);
      const newIds = updatedData.members || [];
      for (const id of existingIds) {
        if (!newIds.includes(id)) {
          await mutateRemoveTeamMember.mutateAsync({ teamId, userId: id });
        }
      }
      for (const id of newIds) {
        if (!existingIds.includes(id)) {
          await mutateAddTeamMember.mutateAsync({ teamId, userId: id });
        }
      }
    } catch (err) {
      console.error('Failed to update team:', err);
      alert('Failed to update team: ' + err.message);
    }
  }, [mutateUpdateTeam, rawUsers, mutateUpdateEmployee, mutateRemoveTeamMember, mutateAddTeamMember]);

  const editProject = useCallback(async (projectId, updatedData) => {
    try {
      await mutateUpdateProject.mutateAsync({ id: projectId, data: updatedData });
      const existingMembers = await projectService.getMembers(projectId);
      const existingIds = existingMembers.map(m => m.id);
      const newIds = updatedData.members || [];
      for (const id of existingIds) {
        if (!newIds.includes(id)) {
          await mutateRemoveProjectMember.mutateAsync({ projectId, userId: id });
        }
      }
      for (const id of newIds) {
        if (!existingIds.includes(id)) {
          await mutateAddProjectMember.mutateAsync({ projectId, userId: id });
        }
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      alert('Failed to update project: ' + err.message);
    }
  }, [mutateUpdateProject, mutateRemoveProjectMember, mutateAddProjectMember]);

  const editTask = useCallback(async (taskId, updatedData) => {
    try {
      await mutateUpdateTask.mutateAsync({ id: taskId, data: updatedData });
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task: ' + err.message);
    }
  }, [mutateUpdateTask]);

  const editEmployee = useCallback(async (userId, updatedData) => {
    try {
      const updated = await mutateUpdateEmployee.mutateAsync({ id: userId, data: updatedData });
      const currentTeams = teams.filter(t => t.members.includes(userId)).map(t => t.id);
      const targetTeams = updatedData.teams || [];
      const teamsToAdd = targetTeams.filter(id => !currentTeams.includes(id));
      const teamsToRemove = currentTeams.filter(id => !targetTeams.includes(id));
      const currentProjects = projects.filter(p => p.members.includes(userId)).map(p => p.id);
      const targetProjects = updatedData.projects || [];
      const projectsToAdd = targetProjects.filter(id => !currentProjects.includes(id));
      const projectsToRemove = currentProjects.filter(id => !targetProjects.includes(id));
      await Promise.all([
        ...teamsToAdd.map(teamId => mutateAddTeamMember.mutateAsync({ teamId, userId })),
        ...teamsToRemove.map(teamId => mutateRemoveTeamMember.mutateAsync({ teamId, userId })),
        ...projectsToAdd.map(projectId => mutateAddProjectMember.mutateAsync({ projectId, userId })),
        ...projectsToRemove.map(projectId => mutateRemoveProjectMember.mutateAsync({ projectId, userId }))
      ]);
      if (auth.currentUser?.id === userId) {
        auth.setCurrentUser(updated);
      }
    } catch (err) {
      console.error('Failed to update employee:', err);
      throw err;
    }
  }, [teams, projects, mutateUpdateEmployee, mutateAddTeamMember, mutateRemoveTeamMember, mutateAddProjectMember, mutateRemoveProjectMember, auth]);

  const addTaskComment = useCallback(async (taskId, commentText) => {
    try {
      await mutateAddTaskComment.mutateAsync({
        taskId,
        authorEmployeeId: auth.currentUser?.id,
        commentText
      });
    } catch (err) {
      console.error('Failed to add task comment:', err);
    }
  }, [mutateAddTaskComment, auth.currentUser?.id]);

  const updateTaskProgress = useCallback(async (taskId, percentage, notes) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const newStatus = (task.status === 'Open' || task.status === 'open') && percentage > 0 ? 'In Progress' : task.status;
      await mutateUpdateTaskProgress.mutateAsync({
        taskId,
        employeeId: auth.currentUser?.id,
        progressPercentage: percentage,
        remarks: notes
      });
      if (newStatus !== task.status) {
        await mutateUpdateTask.mutateAsync({
          id: taskId,
          data: { ...task, status: newStatus }
        });
      }
      if (notes) {
        await addTaskComment(taskId, `[Progress Update ${percentage}%]: ${notes}`);
      }
    } catch (err) {
      console.error('Failed to update task progress:', err);
      alert('Failed to update task progress: ' + err.message);
    }
  }, [tasks, auth.currentUser?.id, mutateUpdateTaskProgress, mutateUpdateTask, addTaskComment]);

  const submitTaskForReview = useCallback(async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: { ...task, status: 'Pending Review' }
      });
      const tlUser = users.find(u => u.role === 'Team Lead');
      if (tlUser) {
        handleAddNotification({
          id: `notif-${Date.now()}`,
          recipientId: tlUser.id,
          type: "TASK_UPDATED",
          title: "Task Submitted for Review",
          message: `${auth.currentUser?.name} completed and submitted ${task?.taskNumber || 'Task'} for review.`,
          entityType: "TASK",
          entityId: taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to submit task for review:', err);
      alert('Failed to submit task for review: ' + err.message);
    }
  }, [tasks, mutateUpdateTask, users, auth.currentUser?.name, handleAddNotification]);

  const approveTaskCompletion = useCallback(async (taskId, approve = true, comments = '') => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const status = approve ? 'Completed' : 'In Progress';
      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: {
          ...task,
          status,
          completionReviewStatus: approve ? 'Approved' : 'Rejected',
          reviewComment: comments
        }
      });
      handleAddNotification({
        id: `notif-${Date.now()}`,
        recipientId: task.assignedTo,
        type: "TASK_UPDATED",
        title: approve ? "Task Approved" : "Task Re-opened",
        message: approve
          ? `Your completion of ${task.taskNumber} has been approved by ${auth.currentUser?.name}.`
          : `Your completion of ${task.taskNumber} has been rejected. Reason: ${comments}`,
        entityType: "TASK",
        entityId: taskId,
        channel: "WHATSAPP",
        isRead: false,
        createdAt: new Date().toISOString()
      });
      if (comments) {
        await addTaskComment(taskId, `[Review Comment by ${auth.currentUser?.name}]: ${comments}`);
      }
    } catch (err) {
      console.error('Failed to resolve task completion:', err);
      alert('Failed to resolve task completion: ' + err.message);
    }
  }, [tasks, mutateUpdateTask, auth.currentUser?.name, handleAddNotification, addTaskComment]);

  const revertTaskCompletion = useCallback(async (taskId) => {
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) return;
      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: {
          ...taskObj,
          status: 'Pending Review',
          completionReviewStatus: null,
          reviewComment: ''
        }
      });
    } catch (err) {
      console.error("Failed to revert task completion:", err);
    }
  }, [tasks, mutateUpdateTask]);

  const claimBacklogTask = useCallback(async (taskId) => {
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) return;
      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: {
          ...taskObj,
          assignedTo: auth.currentUser?.id,
          status: 'In Progress'
        }
      });
      const admins = users.filter(u => u.role === 'Admin');
      admins.forEach(admin => {
        handleAddNotification({
          id: `notif-${Date.now()}-${admin.id}`,
          recipientId: admin.id,
          type: "BACKLOG_CLAIMED",
          title: "Backlog Task Claimed",
          message: `${auth.currentUser?.name} has claimed backlog task ${taskObj.taskNumber}: ${taskObj.name}.`,
          entityType: "TASK",
          entityId: taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      });
      const proj = projects.find(p => p.id === taskObj.projectId);
      if (proj && proj.teams) {
        const projectTeams = teams.filter(t => proj.teams.includes(t.id));
        const notifiedLeadIds = new Set(admins.map(a => a.id));
        projectTeams.forEach(team => {
          if (team.leadId && !notifiedLeadIds.has(team.leadId) && String(team.leadId) !== String(auth.currentUser?.id)) {
            notifiedLeadIds.add(team.leadId);
            handleAddNotification({
              id: `notif-${Date.now()}-${team.leadId}`,
              recipientId: team.leadId,
              type: "BACKLOG_CLAIMED",
              title: "Backlog Task Claimed",
              message: `${auth.currentUser?.name} has claimed backlog task ${taskObj.taskNumber}: ${taskObj.name} from project ${proj.name.split(' (')[0]}.`,
              entityType: "TASK",
              entityId: taskId,
              channel: "IN_APP",
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    } catch (err) {
      console.error('Failed to claim backlog task:', err);
      alert('Failed to claim backlog task: ' + err.message);
    }
  }, [tasks, auth.currentUser?.id, auth.currentUser?.name, users, projects, teams, handleAddNotification, mutateUpdateTask]);

  return (
    <AppContext.Provider
      value={{
        employeesLoading,
        employeesError,
        theme,
        toggleTheme,
        isAuthenticated: auth.isAuthenticated,
        currentUser: auth.currentUser,
        verifyPassword: auth.verifyPassword,
        login: auth.login,
        logout: auth.logout,
        forgotPassword: auth.forgotPassword,
        changeUser: auth.changeUser,
        users,
        projects: adjustedProjects,
        tasks: tasksWithLoggedHours,
        timeEntries: timeEntriesHook.timeEntries,
        reports: timeEntriesHook.reports,
        notifications: notificationsHook.notifications,
        meetings: meetingsHook.meetings,
        etaExtensions: etaExtensionsHook.etaExtensions,
        taskTransfers: taskTransfersHook.taskTransfers,
        taskComments: taskCommentsMap,
        attendanceHistory: attendanceHook.attendanceHistory,
        announcements: announcementsHook.announcements,
        teams,
        adminSettings: adminSettingsHook.adminSettings,
        setAdminSettings: adminSettingsHook.setAdminSettings,
        timerState: timerHook.timerState,
        clockIn: timerHook.clockIn,
        toggleBreak: timerHook.toggleBreak,
        clockOut: timerHook.clockOut,
        cancelTimer: timerHook.cancelTimer,
        addManualEntry: timeEntriesHook.addManualEntry,
        deleteTimeEntry: timeEntriesHook.deleteTimeEntry,
        createProject,
        deleteProject,
        createTask,
        deleteTask,
        addEmployee,
        deleteEmployee,
        createTeam,
        deleteTeam,
        submitTimesheetReport: timeEntriesHook.submitTimesheetReport,
        unsubmitTimesheetReport: timeEntriesHook.unsubmitTimesheetReport,
        updateEntryStatus: timeEntriesHook.updateEntryStatus,
        approveTimesheetReport: timeEntriesHook.approveTimesheetReport,
        revertEntryStatus: timeEntriesHook.revertEntryStatus,
        revertTimesheetReport: timeEntriesHook.revertTimesheetReport,
        revertTaskCompletion,
        revertETAExtension: etaExtensionsHook.revertETAExtension,
        revertTaskTransfer: taskTransfersHook.revertTaskTransfer,
        markNotificationRead: notificationsHook.markNotificationRead,
        markNotificationUnread: notificationsHook.markNotificationUnread,
        deleteNotification: notificationsHook.deleteNotification,
        clearNotifications: notificationsHook.clearNotifications,
        createMeeting: meetingsHook.createMeeting,
        requestETAExtension: etaExtensionsHook.requestETAExtension,
        reviewETAExtension: etaExtensionsHook.reviewETAExtension,
        requestTaskTransfer: taskTransfersHook.requestTaskTransfer,
        reviewTaskTransfer: taskTransfersHook.reviewTaskTransfer,
        addTaskComment,
        updateTaskProgress,
        submitTaskForReview,
        claimBacklogTask,
        approveTaskCompletion,
        createAnnouncement: announcementsHook.createAnnouncement,
        editTeam,
        editProject,
        editTask,
        editEmployee,
        editTimeEntry: timeEntriesHook.editTimeEntry,
        getAdjustedProjectColor,
        pageZoom,
        setPageZoom
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
