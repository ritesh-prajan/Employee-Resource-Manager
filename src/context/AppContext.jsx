import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth as useAuthContext } from './AuthContext';
import { useToast } from './ToastContext';

import { useEmployees } from '../hooks/useEmployees';
import { useTeams } from '../hooks/useTeams';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';

import { useAuth } from '../hooks/useAuth';
import { useTimer } from '../hooks/useTimer';
import { useNotifications } from '../hooks/useNotifications';
// useTimeEntries replaces the old useTimeEntries — it talks to the real backend
// instead of keeping everything in local React state.
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useMeetings } from '../hooks/useMeetings';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { useETAExtensions } from '../hooks/useETAExtensions';
import { useTaskTransfers } from '../hooks/useTaskTransfers';
import { useAttendance } from '../hooks/useAttendance';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { getAdjustedProjectColor } from '../utils/colorUtils';
import { useDomainActions } from '../hooks/useDomainActions';



const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const toast = useToast();
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
    
    // Build the shape timesheetService.create() expects and POST it to the backend.
    // The old code built this with a fake id and pushed it into local state only.
    // Now .mutate() sends it to the server; on success React Query re-fetches
    // the timesheet list so the UI reflects the real database entry.
    const newEntry = {
      employeeId:   auth.currentUser?.id,
      taskId:       timerState.taskId,
      projectId:    timerState.projectId,
      description:  timerState.description,
      date:         todayStr,
      startTime:    checkInTime.toTimeString().slice(0, 5),
      endTime:      displayEndTime.toTimeString().slice(0, 5),
      duration:     durationHours.toString(),
      workCategory: timerState.workCategory,
      justification
    };
    timeEntriesHook.addManualEntry.mutate(newEntry);

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

  // useTimeEntries fetches from the real backend.
  // We no longer pass currentUser/tasks/teams into the hook — the backend
  // handles filtering. Pass { employeeId } if you want only one person's entries.
  const timeEntriesHook = useTimeEntries();

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

  // Sync announcements to notifications list on load
  useEffect(() => {
    if (!auth.currentUser || !announcementsHook.announcements.length) return;

    notificationsHook.setNotifications(prev => {
      const newNotifs = [];
      announcementsHook.announcements.forEach(ann => {
        const notifId = `announcement-notif-${ann.id}`;
        const exists = prev.some(n => n.id === notifId);
        const isCreator = auth.currentUser.name && ann.createdBy && String(ann.createdBy).toLowerCase() === String(auth.currentUser.name).toLowerCase();
        
        if (!exists && !isCreator) {
          newNotifs.push({
            id: notifId,
            recipientId: auth.currentUser.id,
            type: 'ANNOUNCEMENT',
            title: 'Company Announcement',
            message: `Announcement: '${ann.title}' by ${ann.createdBy}`,
            entityType: 'ANNOUNCEMENT',
            entityId: ann.id,
            channel: 'INTERNAL',
            isRead: false,
            createdAt: ann.createdAt
          });
        }
      });
      if (newNotifs.length > 0) {
        return [...newNotifs, ...prev];
      }
      return prev;
    });
  }, [announcementsHook.announcements, auth.currentUser, notificationsHook.setNotifications]);

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

  // Watch for new task comments to notify the owner
  useEffect(() => {
    if (!auth.currentUser || !tasks || tasks.length === 0) return;

    try {
      const storedNotified = localStorage.getItem('erm_notified_comments');
      const notifiedCommentIds = storedNotified ? JSON.parse(storedNotified) : [];
      const newNotifiedIds = [...notifiedCommentIds];
      let hasNew = false;

      tasks.forEach(task => {
        // If the current user is the task owner (assignedTo)
        if (task.assignedTo && String(task.assignedTo) === String(auth.currentUser.id)) {
          if (task.comments && task.comments.length > 0) {
            task.comments.forEach(comment => {
              // And the comment was authored by someone else (not the current user)
              const authorId = comment.userId || comment.author?.id;
              if (authorId && String(authorId) !== String(auth.currentUser.id)) {
                // And we haven't notified them about this comment yet
                if (!notifiedCommentIds.includes(comment.id)) {
                  newNotifiedIds.push(comment.id);
                  hasNew = true;
                  
                  // Add notification!
                  handleAddNotification({
                    id: `notif-comment-${comment.id}-${Date.now()}`,
                    recipientId: auth.currentUser.id,
                    type: "TASK_COMMENTED",
                    title: "New Comment on Your Task",
                    message: `${comment.author?.name || 'Someone'} commented on task ${task.taskNumber || 'Task'}: "${comment.text || comment.commentText || ''}"`,
                    entityType: "TASK",
                    entityId: task.id,
                    channel: "IN_APP",
                    isRead: false,
                    createdAt: comment.createdAt || comment.timestamp || new Date().toISOString()
                  });
                }
              }
            });
          }
        }
      });

      if (hasNew) {
        localStorage.setItem('erm_notified_comments', JSON.stringify(newNotifiedIds));
      }
    } catch (e) {
      console.error("Failed to check for new comment notifications:", e);
    }
  }, [tasks, auth.currentUser, handleAddNotification]);

  const domainActions = useDomainActions({
    tasks,
    projects,
    teams,
    users,
    rawUsers,
    auth,
    notificationsHook,
    handleAddNotification,
    toast,
    mutateCreateProject,
    mutateRemoveProject,
    mutateUpdateProject,
    mutateAddProjectMember,
    mutateRemoveProjectMember,
    mutateCreateTask,
    mutateRemoveTask,
    mutateUpdateTask,
    mutateAddTaskComment,
    mutateUpdateTaskProgress,
    mutateCreateEmployee,
    mutateUpdateEmployee,
    mutateRemoveEmployee,
    mutateCreateTeam,
    mutateRemoveTeam,
    mutateUpdateTeam,
    mutateAddTeamMember,
    mutateRemoveTeamMember
  });

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
        addManualEntry: (data) => timeEntriesHook.addManualEntry.mutateAsync(data),
        deleteTimeEntry: (id) => timeEntriesHook.deleteTimeEntry.mutate(id),
        ...domainActions,
        // Plain-function wrappers so components can call these directly:
        //   updateEntryStatus(id, 'Approved', comment)
        //   revertEntryStatus(id)  → sets status back to Pending
        updateEntryStatus: (id, status, managerComment = '') =>
          timeEntriesHook.updateEntryStatus.mutate({ id, status, managerComment }),
        revertEntryStatus: (id) =>
          timeEntriesHook.updateEntryStatus.mutate({ id, status: 'Pending', managerComment: '' }),

        // Reports — no backend endpoint yet
        submitTimesheetReport:   () => console.warn('submitTimesheetReport: no backend yet'),
        unsubmitTimesheetReport: () => console.warn('unsubmitTimesheetReport: no backend yet'),
        approveTimesheetReport:  () => console.warn('approveTimesheetReport: no backend yet'),
        revertTimesheetReport:   () => console.warn('revertTimesheetReport: no backend yet'),
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
        createAnnouncement: announcementsHook.createAnnouncement,
        // editTimeEntry had no backend equivalent in the old hook (local state only).
        // For now, wire it to a no-op so components don't crash.
        // Implement via a PUT /timesheets/:id endpoint when the backend is ready.
        editTimeEntry: () => console.warn('editTimeEntry: no backend endpoint yet'),
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
