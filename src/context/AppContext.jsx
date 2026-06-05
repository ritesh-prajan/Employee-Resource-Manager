import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  MOCK_USERS, 
  MOCK_PROJECTS, 
  MOCK_TASKS, 
  MOCK_TIME_ENTRIES, 
  MOCK_TIMESHEET_REPORTS, 
  MOCK_NOTIFICATIONS,
  MOCK_MEETINGS,
  MOCK_ETA_EXTENSIONS,
  MOCK_TASK_TRANSFERS,
  MOCK_TASK_COMMENTS,
  MOCK_ATTENDANCE_HISTORY,
  MOCK_ANNOUNCEMENTS,
  MOCK_TEAMS
} from '../data/mockData';

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

  // Authentication State — boot to login page first
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Core Data States
  const [users, setUsers] = useState(MOCK_USERS);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [timeEntries, setTimeEntries] = useState(MOCK_TIME_ENTRIES);
  const [reports, setReports] = useState(MOCK_TIMESHEET_REPORTS);

  // New Platform Feature States
  const [notifications, setNotifications] = useState(() => {
    // Filter mock notifications to exclude watchdog alerts
    const initialList = MOCK_NOTIFICATIONS.filter(n => n.type !== 'WATCHDOG_LATE' && n.type !== 'WATCHDOG_ABSENT');
    const todayStr = "2026-05-29";
    
    // Dynamically compile Overdue Task Alerts (status not COMPLETED or CANCELLED, and today > etaDate)
    MOCK_TASKS.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').forEach(t => {
      if (t.etaDate && new Date(t.etaDate) < new Date(todayStr)) {
        const assignee = MOCK_USERS.find(u => u.id === t.assignedTo);
        
        // Push notification to assignee
        initialList.push({
          id: `overdue-${t.id}-${t.assignedTo}`,
          recipientId: t.assignedTo,
          type: "overdue",
          severity: "danger",
          title: `Task Overdue (ETA Exceeded)`,
          message: `${t.taskNumber}: '${t.name}' assigned to you has exceeded its ETA target date (${new Date(t.etaDate).toLocaleDateString()}).`,
          entityType: "TASK",
          entityId: t.id,
          channel: "IN_APP",
          isRead: false,
          createdAt: t.etaDate
        });

        // Also push notification to Admin (user-admin)
        initialList.push({
          id: `overdue-${t.id}-admin`,
          recipientId: "user-admin",
          type: "overdue",
          severity: "danger",
          title: `Task Overdue (ETA Exceeded)`,
          message: `${t.taskNumber}: '${t.name}' assigned to ${assignee?.name || 'Unassigned'} has exceeded its ETA target date (${new Date(t.etaDate).toLocaleDateString()}).`,
          entityType: "TASK",
          entityId: t.id,
          channel: "IN_APP",
          isRead: false,
          createdAt: t.etaDate
        });
      }
    });
    
    return initialList;
  });
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [etaExtensions, setEtaExtensions] = useState(MOCK_ETA_EXTENSIONS);
  const [taskTransfers, setTaskTransfers] = useState(MOCK_TASK_TRANSFERS);
  const [taskComments, setTaskComments] = useState(MOCK_TASK_COMMENTS);
  const [attendanceHistory, setAttendanceHistory] = useState(MOCK_ATTENDANCE_HISTORY);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [teams, setTeams] = useState(MOCK_TEAMS);

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

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Dynamically update roles based on team lead assignment
  useEffect(() => {
    setUsers(prevUsers => {
      let changed = false;
      const nextUsers = prevUsers.map(user => {
        if (user.id === 'user-admin') return user; // Keep Admin as is
        const leadsAnyTeam = teams.some(t => t.leadId === user.id);
        const targetRole = leadsAnyTeam ? 'Team Lead' : 'Employee';
        if (user.role !== targetRole) {
          changed = true;
          return { ...user, role: targetRole };
        }
        return user;
      });
      if (changed) {
        return nextUsers;
      }
      return prevUsers;
    });
  }, [teams]);

  useEffect(() => {
    if (currentUser) {
      const match = users.find(u => u.id === currentUser.id);
      if (match && JSON.stringify(match) !== JSON.stringify(currentUser)) {
        setCurrentUser(match);
      }
    }
  }, [users, currentUser]);

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

  // Toggle Break Action
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

    // Update logged hours on the task
    setTasks(prevTasks => 
      prevTasks.map(t => {
        if (t.id === timerState.taskId) {
          // If task status was OPEN, auto-transition to IN_PROGRESS
          const status = t.status === 'Open' ? 'In Progress' : t.status;
          return { 
            ...t, 
            status,
            logged: parseFloat((t.logged + durationHours).toFixed(2)) 
          };
        }
        return t;
      })
    );

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

    setTasks(prevTasks => 
      prevTasks.map(t => {
        if (t.id === entryData.taskId) {
          const status = t.status === 'Open' ? 'In Progress' : t.status;
          return { 
            ...t, 
            status,
            logged: parseFloat((t.logged + duration).toFixed(2)) 
          };
        }
        return t;
      })
    );

    setTimeEntries(prev => [newEntry, ...prev]);
  };

  // Delete Time Entry
  const deleteTimeEntry = (entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    const duration = parseFloat(entry.duration) || 0;
    setTasks(prevTasks => 
      prevTasks.map(t => {
        if (t.id === entry.taskId) {
          return { ...t, logged: Math.max(0, parseFloat((t.logged - duration).toFixed(2))) };
        }
        return t;
      })
    );

    setTimeEntries(prev => prev.filter(e => e.id !== entryId));
  };

  // Create Project
  const createProject = (projData) => {
    // If individual members are provided, use them; otherwise, resolve from assigned teams
    let finalMembers = [];
    if (projData.members && projData.members.length > 0) {
      finalMembers = projData.members;
    } else {
      const teamObjects = teams.filter(t => (projData.teams || []).includes(t.id));
      const membersSet = new Set();
      teamObjects.forEach(t => {
        if (t.leadId) membersSet.add(t.leadId);
        t.members.forEach(mId => membersSet.add(mId));
      });
      finalMembers = Array.from(membersSet);
    }

    const newProj = {
      id: `proj-${Date.now()}`,
      name: projData.name,
      client: projData.client || 'Internal',
      color: projData.color || '#8ECAE6',
      teams: projData.teams || [],
      members: finalMembers,
      status: projData.status || 'Active',
      epic: projData.epic || '',
      story: projData.story || '',
      release: projData.release || ''
    };
    setProjects(prev => [...prev, newProj]);
  };

  // Create Task
  const createTask = (taskData) => {
    const latestNum = tasks.reduce((max, t) => {
      const num = parseInt(t.taskNumber.split('-')[1]);
      return num > max ? num : max;
    }, 42);

    const newTask = {
      id: `task-${Date.now()}`,
      taskNumber: `TASK-0${latestNum + 1}`,
      bugNumber: taskData.type === 'Bug' ? taskData.bugNumber || 'BUG-9999' : null,
      name: taskData.name,
      projectId: taskData.projectId,
      assignedTo: taskData.assignedTo,
      eta: parseFloat(taskData.eta) || 0,
      logged: 0,
      status: 'Open',
      type: taskData.type || 'Story',
      priority: taskData.priority || 'Medium',
      epic: taskData.epic || 'Backlog',
      createdAt: new Date().toISOString(),
      etaDate: taskData.etaDate || new Date(Date.now() + 3*24*60*60*1000).toISOString()
    };

    setTasks(prev => [...prev, newTask]);

    // Send notification to assignee
    const assignee = users.find(u => u.id === taskData.assignedTo);
    if (assignee) {
      const newNotif = {
        id: `notif-${Date.now()}`,
        recipientId: assignee.id,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `You have been assigned ${newTask.taskNumber}: ${newTask.name} by ${currentUser.name}.`,
        entityType: "TASK",
        entityId: newTask.id,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Add Employee (Admin only)
  const addEmployee = (empData) => {
    const latestEmpCodeNum = users.reduce((max, u) => {
      if (u.employee_code && u.employee_code.startsWith("EMP-")) {
        const num = parseInt(u.employee_code.split("-")[1]);
        return num > max ? num : max;
      }
      return max;
    }, 44);

    const newEmpId = `user-${Date.now()}`;
    const designation = empData.designation || empData.department || 'Engineering';

    const newEmp = {
      id: newEmpId,
      name: empData.name,
      email: empData.email,
      personalEmail: empData.personalEmail || '',
      role: empData.role || 'Employee',
      avatar: empData.avatar || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*1000000)}?w=150`,
      status: 'Active',
      department: designation,
      designation: designation,
      phone: empData.phone || "+91 99999 88888",
      whatsapp_number: empData.phone || "+91 99999 88888",
      employee_code: empData.employee_code || `EMP-00${latestEmpCodeNum + 1}`,
      password: empData.password || '',
      notification_preference: empData.notification_preference || "IN_APP"
    };

    setUsers(prev => [...prev, newEmp]);

    // Sync Teams
    if (empData.teams && Array.isArray(empData.teams)) {
      setTeams(prevTeams => prevTeams.map(t => {
        const isSelected = empData.teams.includes(t.id);
        const isMember = t.members.includes(newEmpId);
        if (isSelected && !isMember) {
          return { ...t, members: [...t.members, newEmpId] };
        } else if (!isSelected && isMember) {
          return { ...t, members: t.members.filter(mId => mId !== newEmpId) };
        }
        return t;
      }));
    }

    // Sync Projects
    if (empData.projects && Array.isArray(empData.projects)) {
      setProjects(prevProjects => prevProjects.map(p => {
        const isSelected = empData.projects.includes(p.id);
        const isMember = p.members.includes(newEmpId);
        if (isSelected && !isMember) {
          return { ...p, members: [...p.members, newEmpId] };
        } else if (!isSelected && isMember) {
          return { ...p, members: p.members.filter(mId => mId !== newEmpId) };
        }
        return p;
      }));
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
            // Deduct hours from task logged and set task status to 'Rejected'
            setTasks(prevTasks =>
              prevTasks.map(t => {
                if (t.id === e.taskId) {
                  return { 
                    ...t, 
                    logged: Math.max(0, parseFloat((t.logged - parseFloat(e.duration)).toFixed(2))),
                    status: 'Rejected',
                    rejectionComment: comment
                  };
                }
                return t;
              })
            );

            // Notify the employee about the rejection
            const taskObj = tasks.find(t => t.id === e.taskId);
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
          } else if (e.status === 'Rejected' && !isRejection) {
            // Re-add hours to task logged
            setTasks(prevTasks =>
              prevTasks.map(t => {
                if (t.id === e.taskId) {
                  return { ...t, logged: parseFloat((t.logged + parseFloat(e.duration)).toFixed(2)) };
                }
                return t;
              })
            );
          } else if (status === 'Approved') {
            // If approved, set task status to Completed if it was Pending Review
            setTasks(prevTasks =>
              prevTasks.map(t => {
                if (t.id === e.taskId && t.status === 'Pending Review') {
                  return { ...t, status: 'Completed' };
                }
                return t;
              })
            );
          }
          return { ...e, status, managerComment: comment };
        }
        return e;
      })
    );
  };

  const claimBacklogTask = (taskId) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    // Assign task to current user
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, assignedTo: currentUser.id, status: 'In Progress' };
      }
      return t;
    }));

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
            setTasks(prevTasks => 
              prevTasks.map(t => {
                if (t.id === req.taskId) {
                  return { 
                    ...t, 
                    status: 'ETA_Extended',
                    etaDate: req.newEta
                  };
                }
                return t;
              })
            );
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
            setTasks(prevTasks => 
              prevTasks.map(t => {
                if (t.id === req.taskId) {
                  return { 
                    ...t, 
                    assignedTo: req.createdTo,
                    status: 'Transferred' // or Open
                  };
                }
                return t;
              })
            );

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
  const addTaskComment = (taskId, commentText) => {
    const newComment = {
      id: `comm-${Date.now()}`,
      taskId,
      authorId: currentUser.id,
      commentText,
      createdAt: new Date().toISOString()
    };
    setTaskComments(prev => [...prev, newComment]);
  };

  // Task Progress & Status
  const updateTaskProgress = (taskId, percentage, notes) => {
    setTasks(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          // If first progress update, auto-transition to In Progress
          const status = t.status === 'Open' && percentage > 0 ? 'In Progress' : t.status;
          return { ...t, status, progress: percentage };
        }
        return t;
      })
    );

    // Track in comments or progress history
    if (notes) {
      addTaskComment(taskId, `[Progress Update ${percentage}%]: ${notes}`);
    }
  };

  const submitTaskForReview = (taskId) => {
    setTasks(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: 'Pending Review' };
        }
        return t;
      })
    );

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
  };

  const approveTaskCompletion = (taskId, approve = true, comments = '') => {
    setTasks(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          const status = approve ? 'Completed' : 'In Progress';
          
          // Notify employee
          const newNotif = {
            id: `notif-${Date.now()}`,
            recipientId: t.assignedTo,
            type: approve ? "TASK_UPDATED" : "TASK_UPDATED",
            title: approve ? "Task Approved" : "Task Re-opened",
            message: approve
              ? `Your completion of ${t.taskNumber} has been approved by ${currentUser.name}.`
              : `Your completion of ${t.taskNumber} has been rejected. Reason: ${comments}`,
            entityType: "TASK",
            entityId: taskId,
            channel: "WHATSAPP",
            isRead: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prevNotif => [newNotif, ...prevNotif]);

          return { 
            ...t, 
            status, 
            completionReviewStatus: approve ? 'Approved' : 'Rejected',
            reviewComment: comments
          };
        }
        return t;
      })
    );

    if (comments) {
      addTaskComment(taskId, `[Review Comment by ${currentUser.name}]: ${comments}`);
    }
  };

  // Create Team Action
  const createTeam = (teamData) => {
    const membersSet = new Set(teamData.members || []);
    if (teamData.leadId) {
      membersSet.add(teamData.leadId);
    }
    const newTeam = {
      id: `team-${Date.now()}`,
      name: teamData.name,
      leadId: teamData.leadId,
      members: Array.from(membersSet),
      createdAt: new Date().toISOString()
    };
    setTeams(prev => [...prev, newTeam]);
  };

  // Delete Team Action
  const deleteTeam = (teamId) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
  };

  // Delete Project Action
  const deleteProject = (projectId) => {
    // Remove the project
    setProjects(prev => prev.filter(p => p.id !== projectId));
    // Also remove any tasks tied to the project to keep data consistent
    setTasks(prev => prev.filter(t => t.projectId !== projectId));
  };

  // Delete Task Action
  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Delete Employee Action
  const deleteEmployee = (userId) => {
    // Safeguard: cannot delete logged in user or admin Sarah
    if (userId === currentUser?.id || userId === 'user-admin') return;
    setUsers(prev => prev.filter(u => u.id !== userId));
    // Also remove from teams members lists
    setTeams(prev => 
      prev.map(t => ({
        ...t,
        members: t.members.filter(mId => mId !== userId)
      }))
    );
    // Also remove from projects members lists
    setProjects(prev =>
      prev.map(p => ({
        ...p,
        members: p.members.filter(mId => mId !== userId)
      }))
    );
  };

  // Edit Team Action
  const editTeam = (teamId, updatedData) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...updatedData } : t));
  };

  // Edit Project Action
  const editProject = (projectId, updatedData) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatedData } : p));
  };

  // Edit Task Action
  const editTask = (taskId, updatedData) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedData } : t));
  };

  // Edit Employee Action
  const editEmployee = (userId, updatedData) => {
    const finalData = { ...updatedData };
    if (updatedData.designation !== undefined) {
      finalData.department = updatedData.designation;
    } else if (updatedData.department !== undefined) {
      finalData.designation = updatedData.department;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...finalData } : u));

    // Sync Teams
    if (updatedData.teams && Array.isArray(updatedData.teams)) {
      setTeams(prevTeams => prevTeams.map(t => {
        const isSelected = updatedData.teams.includes(t.id);
        const isMember = t.members.includes(userId);
        if (isSelected && !isMember) {
          return { ...t, members: [...t.members, userId] };
        } else if (!isSelected && isMember) {
          return { ...t, members: t.members.filter(mId => mId !== userId) };
        }
        return t;
      }));
    }

    // Sync Projects
    if (updatedData.projects && Array.isArray(updatedData.projects)) {
      setProjects(prevProjects => prevProjects.map(p => {
        const isSelected = updatedData.projects.includes(p.id);
        const isMember = p.members.includes(userId);
        if (isSelected && !isMember) {
          return { ...p, members: [...p.members, userId] };
        } else if (!isSelected && isMember) {
          return { ...p, members: p.members.filter(mId => mId !== userId) };
        }
        return p;
      }));
    }
  };

  // Edit Time Entry Action
  const editTimeEntry = (entryId, updatedData) => {
    setTimeEntries(prev => {
      const oldEntry = prev.find(e => e.id === entryId);
      if (!oldEntry) return prev;

      const oldDuration = parseFloat(oldEntry.duration) || 0;
      const newDuration = parseFloat(updatedData.duration !== undefined ? updatedData.duration : oldEntry.duration) || 0;
      const oldTaskId = oldEntry.taskId;
      const newTaskId = updatedData.taskId !== undefined ? updatedData.taskId : oldEntry.taskId;

      setTasks(prevTasks => 
        prevTasks.map(t => {
          let logged = t.logged;
          if (oldTaskId === newTaskId) {
            if (t.id === oldTaskId) {
              logged = Math.max(0, parseFloat((logged - oldDuration + newDuration).toFixed(2)));
            }
          } else {
            if (t.id === oldTaskId) {
              logged = Math.max(0, parseFloat((logged - oldDuration).toFixed(2)));
            }
            if (t.id === newTaskId) {
              logged = parseFloat((logged + newDuration).toFixed(2));
            }
          }
          return { ...t, logged };
        })
      );

      return prev.map(e => e.id === entryId ? { ...e, ...updatedData } : e);
    });
  };

  // Revert approval actions
  const revertEntryStatus = (entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    if (entry.status === 'Rejected') {
      // Re-add hours back to task since it is no longer rejected
      setTasks(prevTasks =>
        prevTasks.map(t => {
          if (t.id === entry.taskId) {
            return { ...t, logged: parseFloat((t.logged + parseFloat(entry.duration)).toFixed(2)) };
          }
          return t;
        })
      );
    }
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

  const revertTaskCompletion = (taskId) => {
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { 
        ...t, 
        status: 'Pending Review', 
        completionReviewStatus: null, 
        reviewComment: '' 
      } : t)
    );
  };

  const revertETAExtension = (reqId) => {
    const req = etaExtensions.find(e => e.id === reqId);
    if (req && req.status === 'Approved') {
      setTasks(prevTasks =>
        prevTasks.map(t => {
          if (t.id === req.taskId) {
            return {
              ...t,
              status: 'In Progress',
              etaDate: req.oldEta
            };
          }
          return t;
        })
      );
    }
    setEtaExtensions(prev => 
      prev.map(r => r.id === reqId ? { ...r, status: 'Pending', approvedBy: null, approvalDate: null, rejectionReason: null, managerComment: '' } : r)
    );
  };

  const revertTaskTransfer = (reqId) => {
    const req = taskTransfers.find(t => t.id === reqId);
    if (req && req.status === 'Approved') {
      setTasks(prevTasks =>
        prevTasks.map(t => {
          if (t.id === req.taskId) {
            return {
              ...t,
              assignedTo: req.requestedBy,
              status: 'In Progress'
            };
          }
          return t;
        })
      );
    }
    setTaskTransfers(prev => 
      prev.map(r => r.id === reqId ? { ...r, status: 'Pending', reviewedBy: null, reviewedAt: null, rejectionReason: null, managerComment: '' } : r)
    );
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
  const adjustedProjects = projects.map(proj => ({
    ...proj,
    color: getAdjustedProjectColor(proj.color, theme)
  }));

  // Adjust tasks to dynamically calculate their actual logged hours from non-rejected time entries
  const tasksWithLoggedHours = tasks.map(t => {
    const taskEntries = timeEntries.filter(e => e.taskId === t.id);
    const logged = taskEntries.length > 0
      ? taskEntries.filter(e => e.status !== 'Rejected').reduce((sum, e) => sum + parseFloat(e.duration || 0), 0)
      : (t.logged || 0);
    return { ...t, logged: parseFloat(logged.toFixed(2)) };
  });

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        isAuthenticated,
        currentUser,
        login,
        logout,
        forgotPassword,
        changeUser,
        users,
        projects: adjustedProjects,
        tasks: tasksWithLoggedHours,
        setTasks,
        timeEntries,
        reports,
        notifications,
        meetings,
        etaExtensions,
        taskTransfers,
        taskComments,
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
