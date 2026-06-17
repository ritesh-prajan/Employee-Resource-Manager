import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';

import { employeeService } from '../services/employeeService';
import { projectService } from '../services/projectService';
import { teamService } from '../services/teamService';
import { taskService } from '../services/taskService';

import { useEmployees } from '../hooks/useEmployees';
import { useTeams } from '../hooks/useTeams';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';

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
  const { user: authUser, isAuthenticated: authIsAuthenticated } = useAuth();

  // Theme State
  const [theme, setTheme] = useState('light');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Synchronize AppContext auth state with AuthContext synchronously during render
  const [prevAuthUser, setPrevAuthUser] = useState(null);
  if (authUser !== prevAuthUser) {
    setPrevAuthUser(authUser);
    setCurrentUser(authUser);
    setIsAuthenticated(authIsAuthenticated);
  }

 
  // Core Data States (now managed by TanStack Query hooks)
  const { employees: rawUsers, isLoading: employeesLoading, error: employeesError, createEmployee: mutateCreateEmployee, updateEmployee: mutateUpdateEmployee, removeEmployee: mutateRemoveEmployee } = useEmployees({ enabled: isAuthenticated });
  const { teams, createTeam: mutateCreateTeam, updateTeam: mutateUpdateTeam, removeTeam: mutateRemoveTeam, addTeamMember: mutateAddTeamMember, removeTeamMember: mutateRemoveTeamMember } = useTeams({ enabled: isAuthenticated });
  const { 
    projects, 
    createProject: mutateCreateProject, 
    updateProject: mutateUpdateProject, 
    removeProject: mutateRemoveProject,
    addProjectMember: mutateAddProjectMember,
    removeProjectMember: mutateRemoveProjectMember
  } = useProjects({ enabled: isAuthenticated });
  const { tasks, createTask: mutateCreateTask, updateTask: mutateUpdateTask, removeTask: mutateRemoveTask, assignTask: mutateAssignTask, addTaskComment: mutateAddTaskComment, updateTaskProgress: mutateUpdateTaskProgress } = useTasks({ enabled: isAuthenticated });

  // Compute dynamic roles based on team lead assignment
  const users = useMemo(() => {
    if (!rawUsers || !teams) return [];
    let changed = false;
    const nextUsers = rawUsers.map(user => {
      if (user.role === 'Admin') return user;
      const leadsAnyTeam = teams.some(t => t.leadId === user.id);
      const subLeadsAnyTeam = teams.some(t => t.subLeadId === user.id);
      const targetRole = leadsAnyTeam || user.role === 'Team Lead'
        ? 'Team Lead'
        : (subLeadsAnyTeam || user.role === 'Sub Lead' ? 'Sub Lead' : 'Employee');
      if (user.role !== targetRole) {
        changed = true;
        return { ...user, role: targetRole };
      }
      return user;
    });
    return changed ? nextUsers : rawUsers;
  }, [rawUsers, teams]);

  // Compute task comments from enriched tasks
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
  const [timeEntries, setTimeEntries] = useState([]);
  const [reports, setReports] = useState([]);

  // New Platform Feature States
  const [notifications, setNotifications] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [etaExtensions, setEtaExtensions] = useState([]);
  const [taskTransfers, setTaskTransfers] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Configurable thresholds for Admin alerts
  const [adminSettings, setAdminSettings] = useState({
    lateClockInTime: "10:00",
    etaOverdueDays: 2,
    timesheetReviewDays: 7,
    highEtaRateThreshold: 3
  });

  // Active Timer State
  const [timerState, setTimerState] = useState({
    isClockedIn: false,
    startTime: null,
    taskId: '',
    projectId: '',
    description: '',
    workCategory: 'Story',
    isOnBreak: false,
    breakStartTime: null,
    totalBreakSeconds: 0
  });

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);
  // Replaced with TanStack Query hooks
  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };



  useEffect(() => {
    if (currentUser && (currentUser.email || currentUser.workEmail)) {
      const needle = (currentUser.email || currentUser.workEmail || '').toLowerCase();
      const match = users.find(u =>
        (u.email && u.email.toLowerCase() === needle) ||
        (u.workEmail && u.workEmail.toLowerCase() === needle)
      );
      if (match) {
        // Merge: take profile data from the employee record, but KEEP auth fields
        // (role, roles, permissions) from the current auth object — the /employees
        // endpoint doesn't return roles so mapEmployee() always returns 'Employee'.
        const dynamicRole = (match.role && match.role !== 'Employee') ? match.role : (authUser?.role || currentUser.role);
        const merged = {
          ...match,
          role:        dynamicRole,
          roles:       authUser?.roles       || currentUser.roles       || [],
          permissions: authUser?.permissions || currentUser.permissions || [],
          permission:  authUser?.permission  || currentUser.permission  || [],
          components:  authUser?.components  || currentUser.components  || [],
        };
        
        // Property-by-property difference check to prevent infinite loops from key-order differences
        const isDifferent =
          merged.id !== currentUser.id ||
          merged.name !== currentUser.name ||
          merged.email !== currentUser.email ||
          merged.workEmail !== currentUser.workEmail ||
          merged.employee_code !== currentUser.employee_code ||
          merged.phone !== currentUser.phone ||
          merged.personalEmail !== currentUser.personalEmail ||
          merged.designation !== currentUser.designation ||
          merged.department !== currentUser.department ||
          merged.avatar !== currentUser.avatar ||
          merged.profileImage !== currentUser.profileImage ||
          merged.status !== currentUser.status ||
          merged.role !== currentUser.role ||
          JSON.stringify(merged.roles) !== JSON.stringify(currentUser.roles) ||
          JSON.stringify(merged.permissions) !== JSON.stringify(currentUser.permissions);

        if (isDifferent) {
          setCurrentUser(merged);
        }
      }
    }
  }, [users, currentUser, authUser]);

  // Auth Actions
  const login = (email, password) => {
    // Basic verification - check if email matches any mock user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Auto-clock in attendance entry today if employee/lead logging in (mock logic for demo)
      if (user.role === 'Employee' || user.role === 'Team Lead' || user.role === 'Sub Lead') {
        const todayStr = new Date().toISOString().split('T')[0];
        const alreadyClockedIn = attendanceHistory.some(a => a.employeeId === user.id && a.date === todayStr);
        if (!alreadyClockedIn) {
          const newAtt = {
            id: `att-${Date.now()}`,
            employeeId: user.id,
            date: todayStr,
            clockIn: new Date().toISOString(),
            clockOut: null,
            totalWorkHours: "0.00",
            totalBreakHours: "0.00",
            status: "Present",
            clockStatus: "Offline",
            breaks: []
          };
          setAttendanceHistory(prev => [newAtt, ...prev]);
        }
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    cancelTimer();
  };

  const forgotPassword = (email) => {
    // Simulate forgot password link sending
    console.log(`Password reset link sent to ${email}`);
    return true;
  };

  // Change Logged in User (for easy demo testing)
  const changeUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Reset timer state when switching users for clean UX
      setTimerState({
        isClockedIn: false,
        startTime: null,
        taskId: '',
        projectId: '',
        description: '',
        workCategory: 'Story',
        isOnBreak: false,
        breakStartTime: null,
        totalBreakSeconds: 0
      });
    }
  };

  // Clock In Action
  const clockIn = (taskId, projectId, description, workCategory = 'Story') => {
    setTimerState({
      isClockedIn: true,
      startTime: new Date().toISOString(),
      taskId,
      projectId,
      description: description || "Working on task",
      workCategory,
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 0
    });

    // Update real-time attendance clockStatus
    setAttendanceHistory(prev => {
      const todayStr = new Date().toISOString().split('T')[0];
      return prev.map(a => {
        if (a.employeeId === currentUser.id && a.date === todayStr) {
          return { ...a, clockStatus: "Clocked In", lastStatusUpdate: new Date().toISOString() };
        }
        return a;
      });
    });
  };

  // Toggle Break Actio
  const toggleBreak = () => {
    setTimerState(prev => {
      if (!prev.isClockedIn) return prev;

      const now = new Date().toISOString();
      const todayStr = new Date().toISOString().split('T')[0];

      if (!prev.isOnBreak) {
        // Going on break
        setAttendanceHistory(attPrev => 
          attPrev.map(a => {
            if (a.employeeId === currentUser.id && a.date === todayStr) {
              const newBreaks = [...a.breaks, { start: new Date().toTimeString().slice(0, 5), end: null, duration: 0, type: "Regular" }];
              return { ...a, clockStatus: "On Break", breaks: newBreaks, lastStatusUpdate: now };
            }
            return a;
          })
        );
        return {
          ...prev,
          isOnBreak: true,
          breakStartTime: now
        };
      } else {
        // Returning from break
        const breakEnd = new Date();
        const breakStart = new Date(prev.breakStartTime);
        const diffSeconds = Math.floor((breakEnd - breakStart) / 1000);
        const diffMinutes = Math.ceil(diffSeconds / 60);

        setAttendanceHistory(attPrev => 
          attPrev.map(a => {
            if (a.employeeId === currentUser.id && a.date === todayStr) {
              const newBreaks = a.breaks.map(b => b.end === null ? { ...b, end: breakEnd.toTimeString().slice(0, 5), duration: diffMinutes } : b);
              const totalBreakHr = parseFloat((a.totalBreakHours || 0)) + (diffMinutes / 60);
              return { 
                ...a, 
                clockStatus: "Clocked In", 
                breaks: newBreaks, 
                totalBreakHours: totalBreakHr.toFixed(2),
                lastStatusUpdate: now 
              };
            }
            return a;
          })
        );

        return {
          ...prev,
          isOnBreak: false,
          breakStartTime: null,
          totalBreakSeconds: prev.totalBreakSeconds + diffSeconds
        };
      }
    });
  };

  // Clock Out Action
  const clockOut = (justification = '') => {
    if (!timerState.isClockedIn) return;

    const startTime = new Date(timerState.startTime);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const diffMs = new Date() - startTime;
    const breakMs = timerState.totalBreakSeconds * 1000;
    const netMs = Math.max(0, diffMs - breakMs);
    
    let durationHours = (netMs / (1000 * 60 * 60));
    if (durationHours < 0.05) {
      durationHours = 0.5; // demo minimum
    }
    durationHours = parseFloat(durationHours.toFixed(2));

    // Calculate display end time to match duration accurately
    const displayEndTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    const newEntry = {
      id: `entry-${Date.now()}`,
      userId: currentUser.id,
      taskId: timerState.taskId,
      projectId: timerState.projectId,
      description: timerState.description,
      date: todayStr,
      startTime: startTime.toTimeString().slice(0, 5),
      endTime: displayEndTime.toTimeString().slice(0, 5),
      duration: durationHours.toString(),
      status: 'Pending',
      workCategory: timerState.workCategory,
      justification
    };

    // Update task status on the backend if it was Open
    const activeTaskObj = tasks.find(t => t.id === timerState.taskId);
    if (activeTaskObj && activeTaskObj.status === 'Open') {
      mutateUpdateTask.mutateAsync({
        id: timerState.taskId,
        data: {
          ...activeTaskObj,
          status: 'In Progress'
        }
      }).catch(err => console.error("Failed to update task status on clockOut:", err));
    }

    // Save time entry
    setTimeEntries(prev => [newEntry, ...prev]);

    // Update Attendance clockOut
    setAttendanceHistory(prev => 
      prev.map(a => {
        if (a.employeeId === currentUser.id && a.date === todayStr) {
          const checkIn = new Date(a.clockIn);
          const workHr = parseFloat(((endTime - checkIn) / (1000 * 60 * 60) - (parseFloat(a.totalBreakHours) || 0)).toFixed(2));
          return {
            ...a,
            clockOut: endTime.toISOString(),
            clockStatus: "Offline",
            totalWorkHours: Math.max(0, workHr).toFixed(2),
            lastStatusUpdate: endTime.toISOString()
          };
        }
        return a;
      })
    );

    // Check for late notifications / ETA alerts
    const activeTask = tasks.find(t => t.id === timerState.taskId);
    if (activeTask && activeTask.etaDate && new Date() > new Date(activeTask.etaDate)) {
      // Trigger Over-ETA notification simulation
      const newNotif = {
        id: `notif-${Date.now()}`,
        recipientId: currentUser.id,
        type: "TASK_UPDATED",
        title: "Task Over ETA Warning",
        message: `Your task TASK-0042 is past its scheduled ETA date. Please request an extension.`,
        entityType: "TASK",
        entityId: timerState.taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    // Reset Timer state
    setTimerState({
      isClockedIn: false,
      startTime: null,
      taskId: '',
      projectId: '',
      description: '',
      workCategory: 'Story',
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 0
    });
  };

  const cancelTimer = () => {
    setTimerState({
      isClockedIn: false,
      startTime: null,
      taskId: '',
      projectId: '',
      description: '',
      workCategory: 'Story',
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 0
    });
  };

  // Add Manual Entry
  const addManualEntry = (entryData) => {
    const duration = parseFloat(entryData.duration) || 0.5;
    
    // Calculate display end time to match duration accurately
    const startTimeStr = entryData.startTime || '09:00';
    const [h, m] = startTimeStr.split(':').map(Number);
    const totalMinutes = Math.round((h + duration) * 60);
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const newEntry = {
      id: `entry-${Date.now()}`,
      userId: currentUser.id,
      taskId: entryData.taskId,
      projectId: entryData.projectId,
      description: entryData.description || 'Manual Entry',
      date: entryData.date || new Date().toISOString().split('T')[0],
      startTime: startTimeStr,
      endTime: endTimeStr,
      duration: duration.toString(),
      status: 'Pending',
      workCategory: entryData.workCategory || 'Story',
      justification: entryData.justification || ''
    };

    // Update task status on the backend if status is changing
    const taskObjForManual = tasks.find(t => t.id === entryData.taskId);
    if (taskObjForManual) {
      const status = entryData.taskStatus || (taskObjForManual.status === 'Open' ? 'In Progress' : taskObjForManual.status);
      if (status !== taskObjForManual.status) {
        mutateUpdateTask.mutateAsync({
          id: entryData.taskId,
          data: { ...taskObjForManual, status }
        }).catch(err => console.error("Failed to update task status in addManualEntry:", err));
      }
    }

    setTimeEntries(prev => [newEntry, ...prev]);
  };

  // Delete Time Entry
  const deleteTimeEntry = (entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    // No manual setTasks update needed; logged hours are dynamically computed via useMemo

    setTimeEntries(prev => prev.filter(e => e.id !== entryId));
  };

  // Create Project
  const createProject = async (projData) => {
    try {
      const created = await mutateCreateProject.mutateAsync(projData);

      // If members were selected, add them one by one
      if (projData.members && projData.members.length > 0) {
        for (const memberId of projData.members) {
          await mutateAddProjectMember.mutateAsync({ projectId: created.id, userId: memberId });
        }
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('Failed to create project: ' + err.message);
    }
  };

  // Create Task
    const createTask = async (taskData) => {
      try {
        const created = await mutateCreateTask.mutateAsync(taskData);

        // Send notification to assignee
        const assignee = users.find(u => u.id === created.assignedTo);
        if (assignee) {
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientId: assignee.id,
            type: "TASK_ASSIGNED",
            title: "New Task Assigned",
            message: `You have been assigned ${created.taskNumber}: ${created.name} by ${currentUser.name}.`,
            entityType: "TASK",
            entityId: created.id,
            channel: "IN_APP",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prev => [newNotif, ...prev]);
        }
      } catch (err) {
        console.error('Failed to create task:', err);
        alert('Failed to create task: ' + err.message);
      }
    };

    // Add Employee (Admin only)
    const addEmployee = async (empData) => {
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
        throw err; // let the caller surface the error
      }
    };

  // Submit timesheet
  const submitTimesheetReport = (userId, totalHours) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIdx = reports.findIndex(r => r.userId === userId && r.weekStartDate === '2026-05-25');
    
    if (existingIdx > -1) {
      setReports(prev => prev.map((r, i) => i === existingIdx ? { ...r, status: 'Submitted', submittedAt: new Date().toISOString() } : r));
    } else {
      const newReport = {
        id: `report-${Date.now()}`,
        userId,
        weekStartDate: '2026-05-25',
        totalHours,
        status: 'Submitted',
        submittedAt: new Date().toISOString()
      };
      setReports(prev => [...prev, newReport]);
    }
  };

  const updateEntryStatus = (entryId, status, comment = '') => {
    setTimeEntries(prev => 
      prev.map(e => {
        if (e.id === entryId) {
          const wasPendingOrApproved = e.status === 'Pending' || e.status === 'Approved';
          const isRejection = status === 'Rejected';
          
          if (wasPendingOrApproved && isRejection) {
            // Update task status on backend to 'Rejected'
            const taskObj = tasks.find(t => t.id === e.taskId);
            if (taskObj) {
              mutateUpdateTask.mutateAsync({
                id: e.taskId,
                data: {
                  ...taskObj,
                  status: 'Rejected',
                  rejectionComment: comment
                }
              }).catch(err => console.error("Failed to reject task on updateEntryStatus:", err));

              // Notify the employee about the rejection
              const newNotif = {
                id: `notif-${Date.now()}`,
                recipientId: e.userId,
                type: "TASK_REJECTED",
                title: "Time Log Rejected",
                message: `Your time log for ${taskObj?.taskNumber || 'task'} (${taskObj?.name || ''}) was rejected. Feedback: "${comment}"`,
                entityType: "TASK",
                entityId: e.taskId,
                channel: "IN_APP",
                isRead: false,
                createdAt: new Date().toISOString()
              };
              setNotifications(prevNotif => [newNotif, ...prevNotif]);
            }
          } else if (status === 'Approved') {
            // If approved, set task status to Completed if it was Pending Review
            const taskObj = tasks.find(t => t.id === e.taskId);
            if (taskObj && taskObj.status === 'Pending Review') {
              mutateUpdateTask.mutateAsync({
                id: e.taskId,
                data: { ...taskObj, status: 'Completed' }
              }).catch(err => console.error("Failed to complete task on updateEntryStatus:", err));
            }
          }
          return { ...e, status, managerComment: comment };
        }
        return e;
      })
    );
  };

  const claimBacklogTask = async (taskId) => {
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) return;

      // Assign task to current user in the backend
      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: {
          ...taskObj,
          assignedTo: currentUser.id,
          status: 'In Progress'
        }
      });

      // Notify all admins
      const admins = users.filter(u => u.role === 'Admin');
      admins.forEach(admin => {
        const notif = {
          id: `notif-${Date.now()}-${admin.id}`,
          recipientId: admin.id,
          type: "BACKLOG_CLAIMED",
          title: "Backlog Task Claimed",
          message: `${currentUser.name} has claimed backlog task ${taskObj.taskNumber}: ${taskObj.name}.`,
          entityType: "TASK",
          entityId: taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [notif, ...prev]);
      });

      // Notify team leads of the project's teams
      const proj = projects.find(p => p.id === taskObj.projectId);
      if (proj && proj.teams) {
        const projectTeams = teams.filter(t => proj.teams.includes(t.id));
        const notifiedLeadIds = new Set(admins.map(a => a.id));
        projectTeams.forEach(team => {
          if (team.leadId && !notifiedLeadIds.has(team.leadId) && team.leadId !== currentUser.id) {
            notifiedLeadIds.add(team.leadId);
            const notif = {
              id: `notif-${Date.now()}-${team.leadId}`,
              recipientId: team.leadId,
              type: "BACKLOG_CLAIMED",
              title: "Backlog Task Claimed",
              message: `${currentUser.name} has claimed backlog task ${taskObj.taskNumber}: ${taskObj.name} from project ${proj.name.split(' (')[0]}.`,
              entityType: "TASK",
              entityId: taskId,
              channel: "IN_APP",
              isRead: false,
              createdAt: new Date().toISOString()
            };
            setNotifications(prev => [notif, ...prev]);
          }
        });
      }
    } catch (err) {
      console.error('Failed to claim backlog task:', err);
      alert('Failed to claim backlog task: ' + err.message);
    }
  };

  const unsubmitTimesheetReport = (userId, weekStartDate) => {
    setReports(prev =>
      prev.map(r => r.userId === userId && r.weekStartDate === weekStartDate ? { ...r, status: 'Draft', submittedAt: null } : r)
    );
  };

  // Approve timesheet
  const approveTimesheetReport = (reportId, approve = true, comment = '') => {
    setReports(prev => 
      prev.map(r => {
        if (r.id === reportId) {
          const status = approve ? 'Approved' : 'Rejected';
          
          // Send notification to employee
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientId: r.userId,
            type: approve ? "TIMESHEET_APPROVED" : "TIMESHEET_REJECTED",
            title: approve ? "Timesheet Approved" : "Timesheet Rejected",
            message: approve 
              ? `Your weekly timesheet for week starting ${r.weekStartDate} has been approved.`
              : `Your weekly timesheet for week starting ${r.weekStartDate} has been rejected by Team Lead. Reason: ${comment}`,
            entityType: "TIMESHEET",
            entityId: r.id,
            channel: approve ? "IN_APP" : "GMAIL",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prevNotif => [newNotif, ...prevNotif]);
          
          return { ...r, status, managerComment: comment };
        }
        return r;
      })
    );
  };

  // Notifications Actions
  const markNotificationRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markNotificationUnread = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: false } : n)
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Meetings Actions
  const createMeeting = (meetData) => {
    const newMeet = {
      id: `meeting-${Date.now()}`,
      title: meetData.title,
      description: meetData.description,
      meetingDate: meetData.meetingDate,
      durationMinutes: parseInt(meetData.durationMinutes) || 45,
      meetingLink: meetData.meetingLink || "https://teams.microsoft.com/l/meetup-join/mock-created-link",
      created_by: currentUser.id,
      team_id: meetData.team_id || "team-eng",
      notifyVia: meetData.notifyVia || "TEAMS",
      status: "Scheduled",
      participants: meetData.participants || [],
      taskReference: meetData.taskReference || null,
      projectId: meetData.projectId || null
    };

    setMeetings(prev => [...prev, newMeet]);

    // Send notifications to participants
    meetData.participants.forEach(pId => {
      const newNotif = {
        id: `notif-${Date.now()}-${pId}`,
        recipientId: pId,
        type: "MEETING_REMINDER",
        title: "New Meeting Scheduled",
        message: `You are invited to '${newMeet.title}' on ${new Date(newMeet.meetingDate).toLocaleString()}`,
        entityType: "MEETING",
        entityId: newMeet.id,
        channel: newMeet.notifyVia,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    });
  };

  // ETA Extension Requests
  const requestETAExtension = (taskId, newEta, reason) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const newReq = {
      id: `eta-${Date.now()}`,
      taskId,
      taskNumber: taskObj.taskNumber,
      requestedBy: currentUser.id,
      oldEta: taskObj.etaDate,
      newEta,
      reason,
      status: "Pending",
      approvedBy: null,
      approvalDate: null,
      rejectionReason: null,
      createdAt: new Date().toISOString()
    };

    setEtaExtensions(prev => [newReq, ...prev]);

    // Set task status to ETA_EXTENDED or keep in progress but link it.
    // The docs say: status on task updates to ETA_EXTENDED when approved.
    
    // Notify Lead
    const tlUser = users.find(u => u.role === 'Team Lead');
    if (tlUser) {
      const newNotif = {
        id: `notif-${Date.now()}`,
        recipientId: tlUser.id,
        type: "ETA_REQUEST",
        title: "ETA Extension Request",
        message: `${currentUser.name} requested an ETA extension for ${taskObj.taskNumber}.`,
        entityType: "TASK",
        entityId: taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const reviewETAExtension = (id, status, rejectionReason = '') => {
    setEtaExtensions(prev => 
      prev.map(req => {
        if (req.id === id) {
          const approved = status === 'Approved';
          
          // Update the task status & ETA if approved
          if (approved) {
            const task = tasks.find(t => t.id === req.taskId);
            if (task) {
              mutateUpdateTask.mutateAsync({
                id: req.taskId,
                data: {
                  ...task,
                  status: 'ETA_Extended',
                  etaDate: req.newEta
                }
              }).catch(err => console.error("Failed to update task ETA on review:", err));
            }
          }

          // Send notification
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientId: req.requestedBy,
            type: "ETA_DECISION",
            title: `ETA Extension ${status}`,
            message: approved 
              ? `Your ETA extension for ${req.taskNumber} has been approved. New ETA: ${new Date(req.newEta).toLocaleDateString()}`
              : `Your ETA extension for ${req.taskNumber} has been rejected. Reason: ${rejectionReason}`,
            entityType: "TASK",
            entityId: req.taskId,
            channel: "WHATSAPP",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prevNotif => [newNotif, ...prevNotif]);

          return {
            ...req,
            status,
            approvedBy: currentUser.id,
            approvalDate: new Date().toISOString(),
            rejectionReason: rejectionReason || null,
            managerComment: rejectionReason
          };
        }
        return req;
      })
    );
  };

  // Task Transfer Actions
  const requestTaskTransfer = (taskId, targetEmployeeId, reason) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const newReq = {
      id: `transfer-${Date.now()}`,
      taskId,
      taskNumber: taskObj.taskNumber,
      requestedBy: currentUser.id,
      reason,
      status: "Pending",
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdTo: targetEmployeeId || 'unassigned',
      createdAt: new Date().toISOString()
    };

    setTaskTransfers(prev => [newReq, ...prev]);

    // Notify Lead
    const tlUser = users.find(u => u.role === 'Team Lead');
    if (tlUser) {
      const newNotif = {
        id: `notif-${Date.now()}`,
        recipientId: tlUser.id,
        type: "TRANSFER_REQUEST",
        title: "Task Transfer Request",
        message: `${currentUser.name} requested transfer of ${taskObj.taskNumber}.`,
        entityType: "TASK",
        entityId: taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const reviewTaskTransfer = (id, status, rejectionReason = '') => {
    setTaskTransfers(prev => 
      prev.map(req => {
        if (req.id === id) {
          const approved = status === 'Approved';
          
          // Reassign task if approved
          if (approved) {
            const task = tasks.find(t => t.id === req.taskId);
            if (task) {
              mutateUpdateTask.mutateAsync({
                id: req.taskId,
                data: {
                  ...task,
                  assignedTo: req.createdTo,
                  status: 'Transferred'
                }
              }).catch(err => console.error("Failed to update task assignee on transfer review:", err));
            }

            // Notify recipient
            if (req.createdTo !== 'unassigned') {
              const newNotif = {
                id: `notif-${Date.now()}-recv`,
                recipientId: req.createdTo,
                type: "TASK_ASSIGNED",
                title: "Transferred Task Assigned",
                message: `Task ${req.taskNumber} has been reassigned to you from ${users.find(u => u.id === req.requestedBy)?.name}.`,
                entityType: "TASK",
                entityId: req.taskId,
                channel: "IN_APP",
                isRead: false,
                createdAt: new Date().toISOString()
              };
              setNotifications(prevNotif => [newNotif, ...prevNotif]);
            }
          }

          // Notify sender
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientId: req.requestedBy,
            type: "TRANSFER_DECISION",
            title: `Task Transfer ${status}`,
            message: approved 
              ? `Your transfer request for ${req.taskNumber} has been approved.`
              : `Your transfer request for ${req.taskNumber} has been rejected. Reason: ${rejectionReason}`,
            entityType: "TASK",
            entityId: req.taskId,
            channel: "WHATSAPP",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prevNotif => [newNotif, ...prevNotif]);

          return {
            ...req,
            status,
            reviewedBy: currentUser.id,
            reviewedAt: new Date().toISOString(),
            rejectionReason: rejectionReason || null,
            managerComment: rejectionReason
          };
        }
        return req;
      })
    );
  };

  // Task Comments
  const addTaskComment = async (taskId, commentText) => {
    try {
      await mutateAddTaskComment.mutateAsync({
        taskId,
        authorEmployeeId: currentUser.id,
        commentText
      });
    } catch (err) {
      console.error('Failed to add task comment:', err);
    }
  };

  // Task Progress & Status
  const updateTaskProgress = async (taskId, percentage, notes) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = (task.status === 'Open' || task.status === 'open') && percentage > 0 ? 'In Progress' : task.status;
      
      // 1. Post the progress log to the backend
      await mutateUpdateTaskProgress.mutateAsync({
        taskId,
        employeeId: currentUser.id,
        progressPercentage: percentage,
        remarks: notes
      });

      // 2. If status is changing, also update the task status in backend
      if (newStatus !== task.status) {
        await mutateUpdateTask.mutateAsync({
          id: taskId,
          data: { ...task, status: newStatus }
        });
      }

      // 3. Add the comment (it will save to backend and update taskComments locally)
      if (notes) {
        await addTaskComment(taskId, `[Progress Update ${percentage}%]: ${notes}`);
      }
    } catch (err) {
      console.error('Failed to update task progress:', err);
      alert('Failed to update task progress: ' + err.message);
    }
  };

  const submitTaskForReview = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: { ...task, status: 'Pending Review' }
      });
      
      // Notify Lead
      const tlUser = users.find(u => u.role === 'Team Lead');
      if (tlUser) {
        const taskObj = tasks.find(t => t.id === taskId);
        const newNotif = {
          id: `notif-${Date.now()}`,
          recipientId: tlUser.id,
          type: "TASK_UPDATED",
          title: "Task Submitted for Review",
          message: `${currentUser.name} completed and submitted ${taskObj?.taskNumber || 'Task'} for review.`,
          entityType: "TASK",
          entityId: taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    } catch (err) {
      console.error('Failed to submit task for review:', err);
      alert('Failed to submit task for review: ' + err.message);
    }
  };

  const approveTaskCompletion = async (taskId, approve = true, comments = '') => {
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

      // Notify employee
      const newNotif = {
        id: `notif-${Date.now()}`,
        recipientId: task.assignedTo,
        type: "TASK_UPDATED",
        title: approve ? "Task Approved" : "Task Re-opened",
        message: approve
          ? `Your completion of ${task.taskNumber} has been approved by ${currentUser.name}.`
          : `Your completion of ${task.taskNumber} has been rejected. Reason: ${comments}`,
        entityType: "TASK",
        entityId: taskId,
        channel: "WHATSAPP",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prevNotif => [newNotif, ...prevNotif]);

      if (comments) {
        await addTaskComment(taskId, `[Review Comment by ${currentUser.name}]: ${comments}`);
      }
    } catch (err) {
      console.error('Failed to resolve task completion:', err);
      alert('Failed to resolve task completion: ' + err.message);
    }
  };

  // Create Team Action
  const createTeam = async (teamData) => {
  try {
    const created = await mutateCreateTeam.mutateAsync(teamData);
    
    // Automatically update lead user role to Team Lead in backend
    if (teamData.leadId) {
      const leadUser = rawUsers.find(u => String(u.id) === String(teamData.leadId));
      if (leadUser && leadUser.role !== 'Team Lead' && leadUser.role !== 'Admin') {
        await mutateUpdateEmployee.mutateAsync({ id: leadUser.id, data: { ...leadUser, role: 'Team Lead' } });
      }
    }
    
    // Add members one by one after team is created
    if (teamData.members && teamData.members.length > 0) {
      for (const memberId of teamData.members) {
        await mutateAddTeamMember.mutateAsync({ teamId: created.id, userId: memberId });
      }
    }
  } catch (err) {
    console.error('Failed to create team:', err);
    alert('Failed to create team: ' + err.message);
  }
};

  // Delete Team Action
  const deleteTeam = async (teamId, reason = 'Removed by admin') => {
  try {
    await mutateRemoveTeam.mutateAsync(teamId);
  } catch (err) {
    console.error('Failed to delete team:', err);
    alert('Failed to delete team: ' + err.message);
  }
};

  // Delete Project Action
  const deleteProject = async (projectId, reason = 'Removed by admin') => {
  try {
    await mutateRemoveProject.mutateAsync(projectId);
  } catch (err) {
    console.error('Failed to delete project:', err);
    alert('Failed to delete project: ' + err.message);
  }
};

  // Delete Task Action
  const deleteTask = async (taskId, reason = 'Removed by admin') => {
  try {
    await mutateRemoveTask.mutateAsync(taskId);
  } catch (err) {
    console.error('Failed to delete task:', err);
    alert('Failed to delete task: ' + err.message);
  }
};

  // Delete Employee Action
  const deleteEmployee = async (userId, reason = 'Removed by admin') => {
    if (userId === currentUser?.id) return;
    try {
      await mutateRemoveEmployee.mutateAsync({ id: userId, reason });
    } catch (err) {
      console.error('Failed to delete employee:', err);
      throw err;
    }
  };

  // Edit Team Action
const editTeam = async (teamId, updatedData) => {
  try {
    await mutateUpdateTeam.mutateAsync({ id: teamId, data: updatedData });

    // Automatically update lead user role to Team Lead in backend
    if (updatedData.leadId) {
      const leadUser = rawUsers.find(u => String(u.id) === String(updatedData.leadId));
      if (leadUser && leadUser.role !== 'Team Lead' && leadUser.role !== 'Admin') {
        await mutateUpdateEmployee.mutateAsync({ id: leadUser.id, data: { ...leadUser, role: 'Team Lead' } });
      }
    }

    // Sync members: remove all then re-add
    const existingMembers = await teamService.getMembers(teamId);
    const existingIds = existingMembers.map(m => m.id);
    const newIds = updatedData.members || [];

    // Remove members no longer in the list
    for (const id of existingIds) {
      if (!newIds.includes(id)) {
        await mutateRemoveTeamMember.mutateAsync({ teamId, userId: id });
      }
    }
    // Add new members not already there
    for (const id of newIds) {
      if (!existingIds.includes(id)) {
        await mutateAddTeamMember.mutateAsync({ teamId, userId: id });
      }
    }
  } catch (err) {
    console.error('Failed to update team:', err);
    alert('Failed to update team: ' + err.message);
  }
};

const editProject = async (projectId, updatedData) => {
  try {
    await mutateUpdateProject.mutateAsync({ id: projectId, data: updatedData });

    // Sync members
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
};

  // Edit Task Action
  const editTask = async (taskId, updatedData) => {
    try {
      await mutateUpdateTask.mutateAsync({ id: taskId, data: updatedData });
    } catch (err) {
      console.error('Failed to update task:', err);
      alert('Failed to update task: ' + err.message);
    }
  };

  // Edit Employee Action
  const editEmployee = async (userId, updatedData) => {
    try {
      const updated = await mutateUpdateEmployee.mutateAsync({ id: userId, data: updatedData });
      
      // Calculate team additions and removals
      const currentTeams = teams.filter(t => t.members.includes(userId)).map(t => t.id);
      const targetTeams = updatedData.teams || [];
      const teamsToAdd = targetTeams.filter(id => !currentTeams.includes(id));
      const teamsToRemove = currentTeams.filter(id => !targetTeams.includes(id));

      // Calculate project additions and removals
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

      if (currentUser?.id === userId) {
        setCurrentUser(updated);
      }
    } catch (err) {
      console.error('Failed to update employee:', err);
      throw err;
    }
  };
  const verifyPassword = (userId, password) => {
    const user = users.find(u => u.id === userId);
    return user?.password === password;
  };
  // Edit Time Entry Action
  const editTimeEntry = (entryId, updatedData) => {
    setTimeEntries(prev => {
      const oldEntry = prev.find(e => e.id === entryId);
      if (!oldEntry) return prev;
      return prev.map(e => e.id === entryId ? { ...e, ...updatedData } : e);
    });
  };

  // Revert approval actions
  const revertEntryStatus = (entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    setTimeEntries(prev => 
      prev.map(e => e.id === entryId ? { ...e, status: 'Pending', managerComment: '' } : e)
    );

    // Get info for notification messages
    const employee = users.find(u => u.id === entry.userId);
    const taskObj = tasks.find(t => t.id === entry.taskId);
    const taskName = taskObj ? taskObj.name : "timesheet entry";

    // 1. Send notification to the employee
    const employeeNotif = {
      id: `notif-${Date.now()}-${entry.userId}`,
      recipientId: entry.userId,
      type: "APPROVAL_REVERTED",
      title: "Timesheet Approval Reverted",
      message: `The decision for your task "${taskName}" on ${entry.date} has been reverted to Pending.`,
      entityType: "TIME_ENTRY",
      entityId: entryId,
      channel: "IN_APP",
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [employeeNotif, ...prev]);

    // 2. If the admin undid the task, ALSO notify the team lead
    if (currentUser && currentUser.role === 'Admin') {
      const employeeTeams = teams.filter(t => t.members.includes(entry.userId));
      employeeTeams.forEach(team => {
        if (team.leadId && team.leadId !== currentUser.id) {
          const leadNotif = {
            id: `notif-${Date.now()}-${team.leadId}`,
            recipientId: team.leadId,
            type: "APPROVAL_REVERTED",
            title: "Timesheet Approval Reverted (Admin)",
            message: `Admin ${currentUser.name} has reverted the timesheet decision for ${employee ? employee.name : 'an employee'}'s task "${taskName}" on ${entry.date} to Pending.`,
            entityType: "TIME_ENTRY",
            entityId: entryId,
            channel: "IN_APP",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prev => [leadNotif, ...prev]);
        }
      });
    }
  };

  const revertTimesheetReport = (reportId) => {
    setReports(prev => 
      prev.map(r => r.id === reportId ? { ...r, status: 'Submitted', managerComment: '' } : r)
    );
  };

  const revertTaskCompletion = async (taskId) => {
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
  };

  const revertETAExtension = async (reqId) => {
    try {
      const req = etaExtensions.find(e => e.id === reqId);
      if (req && req.status === 'Approved') {
        const t = tasks.find(task => task.id === req.taskId);
        if (t) {
          await mutateUpdateTask.mutateAsync({
            id: req.taskId,
            data: {
              ...t,
              status: 'In Progress',
              etaDate: req.oldEta
            }
          });
        }
      }
      setEtaExtensions(prev => 
        prev.map(r => r.id === reqId ? { ...r, status: 'Pending', approvedBy: null, approvalDate: null, rejectionReason: null, managerComment: '' } : r)
      );
    } catch (err) {
      console.error("Failed to revert ETA extension:", err);
    }
  };

  const revertTaskTransfer = async (reqId) => {
    try {
      const req = taskTransfers.find(t => t.id === reqId);
      if (req && req.status === 'Approved') {
        const t = tasks.find(task => task.id === req.taskId);
        if (t) {
          await mutateUpdateTask.mutateAsync({
            id: req.taskId,
            data: {
              ...t,
              assignedTo: req.requestedBy,
              status: 'In Progress'
            }
          });
        }
      }
      setTaskTransfers(prev => 
        prev.map(r => r.id === reqId ? { ...r, status: 'Pending', reviewedBy: null, reviewedAt: null, rejectionReason: null, managerComment: '' } : r)
      );
    } catch (err) {
      console.error("Failed to revert task transfer:", err);
    }
  };

  // Create Announcement
  const createAnnouncement = (annData) => {
    const newAnn = {
      id: `ann-${Date.now()}`,
      title: annData.title,
      content: annData.content,
      createdBy: currentUser.name,
      priority: annData.priority || 'info',
      createdAt: new Date().toISOString(),
      targetRole: annData.targetRole || "ALL",
      teams: annData.teams || [],
      projects: annData.projects || []
    };

    setAnnouncements(prev => [newAnn, ...prev]);

    // Send notifications to everyone
    users.forEach(u => {
      if (u.id !== currentUser.id) {
        const newNotif = {
          id: `notif-${Date.now()}-${u.id}`,
          recipientId: u.id,
          type: "ANNOUNCEMENT",
          title: "New Company Announcement",
          message: `Announcement: '${newAnn.title}' by ${newAnn.createdBy}`,
          entityType: "ANNOUNCEMENT",
          entityId: newAnn.id,
          channel: "TEAMS",
          isRead: false,
          createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    });
  };

  // Adjust project colors dynamically based on active theme
  const adjustedProjects = useMemo(() => projects.map(proj => ({
  ...proj,
  color: getAdjustedProjectColor(proj.color, theme)
})), [projects, theme]);

  // Adjust tasks to dynamically calculate their actual logged hours from non-rejected time entries
 const tasksWithLoggedHours = useMemo(() => tasks.map(t => {
  const taskEntries = timeEntries.filter(e => e.taskId === t.id);
  const logged = taskEntries.length > 0
    ? taskEntries.filter(e => e.status !== 'Rejected').reduce((sum, e) => sum + parseFloat(e.duration || 0), 0)
    : (t.logged || 0);
  return { ...t, logged: parseFloat(logged.toFixed(2)) };
}), [tasks, timeEntries]);

  // Group task comments by taskId and map to frontend shape for UI compatibility
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

  return (
    <AppContext.Provider
      value={{
        employeesLoading,
        employeesError,//actual backend
        theme,
        toggleTheme,
        isAuthenticated,
        currentUser,
        verifyPassword,
        login,
        logout,
        forgotPassword,
        changeUser,
        users,
        projects: adjustedProjects,
        tasks: tasksWithLoggedHours,
        timeEntries,
        reports,
        notifications,
        meetings,
        etaExtensions,
        taskTransfers,
        taskComments: taskCommentsMap,
        attendanceHistory,
        announcements,
        teams,
        adminSettings,
        setAdminSettings,
        timerState,
        clockIn,
        toggleBreak,
        clockOut,
        cancelTimer,
        addManualEntry,
        deleteTimeEntry,
        createProject,
        deleteProject,
        createTask,
        deleteTask,
        addEmployee,
        deleteEmployee,
        createTeam,
        deleteTeam,
        submitTimesheetReport,
        unsubmitTimesheetReport,
        updateEntryStatus,
        approveTimesheetReport,
        revertEntryStatus,
        revertTimesheetReport,
        revertTaskCompletion,
        revertETAExtension,
        revertTaskTransfer,
        markNotificationRead,
        markNotificationUnread,
        deleteNotification,
        clearNotifications,
        createMeeting,
        requestETAExtension,
        reviewETAExtension,
        requestTaskTransfer,
        reviewTaskTransfer,
        addTaskComment,
        updateTaskProgress,
        submitTaskForReview,
        claimBacklogTask,
        approveTaskCompletion,
        createAnnouncement,
        editTeam,
        editProject,
        editTask,
        editEmployee,
        editTimeEntry,
        getAdjustedProjectColor
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
