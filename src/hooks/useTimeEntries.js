/**
 * @file useTimeEntries.js
 * @description Domain hook for employee daily time logs and weekly timesheet compliance reports, using purely local state.
 */

import { useState, useCallback } from 'react';

export function useTimeEntries({
  currentUser,
  tasks = [],
  users = [],
  teams = [],
  onUpdateTaskStatus,
  onAddNotification
} = {}) {
  const [timeEntries, setTimeEntries] = useState([]);
  const [reports, setReports] = useState([]);

  const addManualEntry = useCallback((entryData) => {
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
      userId: currentUser?.id,
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
    if (onUpdateTaskStatus && entryData.taskId) {
      const taskObjForManual = tasks.find(t => t.id === entryData.taskId);
      if (taskObjForManual) {
        const status = entryData.taskStatus || (taskObjForManual.status === 'Open' ? 'In Progress' : taskObjForManual.status);
        if (status !== taskObjForManual.status) {
          onUpdateTaskStatus(entryData.taskId, status);
        }
      }
    }

    setTimeEntries(prev => [newEntry, ...prev]);
  }, [currentUser, tasks, onUpdateTaskStatus]);

  const deleteTimeEntry = useCallback((entryId) => {
    setTimeEntries(prev => prev.filter(e => e.id !== entryId));
  }, []);

  const editTimeEntry = useCallback((entryId, updatedData) => {
    setTimeEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updatedData } : e));
  }, []);

  const updateEntryStatus = useCallback((entryId, status, comment = '') => {
    setTimeEntries(prev => 
      prev.map(e => {
        if (e.id === entryId) {
          const wasPendingOrApproved = e.status === 'Pending' || e.status === 'Approved';
          const isRejection = status === 'Rejected';
          
          if (wasPendingOrApproved && isRejection) {
            const taskObj = tasks.find(t => t.id === e.taskId);
            if (taskObj) {
              if (onUpdateTaskStatus) {
                onUpdateTaskStatus(e.taskId, 'Rejected', comment);
              }

              // Notify the employee about the rejection
              if (onAddNotification) {
                onAddNotification({
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
                });
              }
            }
          } else if (status === 'Approved') {
            const taskObj = tasks.find(t => t.id === e.taskId);
            if (taskObj && taskObj.status === 'Pending Review') {
              if (onUpdateTaskStatus) {
                onUpdateTaskStatus(e.taskId, 'Completed');
              }
            }
          }
          return { ...e, status, managerComment: comment };
        }
        return e;
      })
    );
  }, [tasks, onUpdateTaskStatus, onAddNotification]);

  const revertEntryStatus = useCallback((entryId) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (!entry) return;

    setTimeEntries(prev => 
      prev.map(e => e.id === entryId ? { ...e, status: 'Pending', managerComment: '' } : e)
    );

    const employee = users.find(u => u.id === entry.userId);
    const taskObj = tasks.find(t => t.id === entry.taskId);
    const taskName = taskObj ? taskObj.name : "timesheet entry";

    if (onAddNotification) {
      onAddNotification({
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
      });

      if (currentUser && currentUser.role === 'Admin') {
        const employeeTeams = teams.filter(t => t.members.includes(entry.userId));
        employeeTeams.forEach(team => {
          if (team.leadId && team.leadId !== currentUser.id) {
            onAddNotification({
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
            });
          }
        });
      }
    }
  }, [timeEntries, users, tasks, currentUser, teams, onAddNotification]);

  // Timesheet Report Management
  const submitTimesheetReport = useCallback((userId, totalHours) => {
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
  }, [reports]);

  const unsubmitTimesheetReport = useCallback((userId, weekStartDate) => {
    setReports(prev =>
      prev.map(r => r.userId === userId && r.weekStartDate === weekStartDate ? { ...r, status: 'Draft', submittedAt: null } : r)
    );
  }, []);

  const approveTimesheetReport = useCallback((reportId, approve = true, comment = '') => {
    setReports(prev => 
      prev.map(r => {
        if (r.id === reportId) {
          const status = approve ? 'Approved' : 'Rejected';
          
          if (onAddNotification) {
            onAddNotification({
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
            });
          }
          
          return { ...r, status, managerComment: comment };
        }
        return r;
      })
    );
  }, [onAddNotification]);

  const revertTimesheetReport = useCallback((reportId) => {
    setReports(prev => 
      prev.map(r => r.id === reportId ? { ...r, status: 'Submitted', managerComment: '' } : r)
    );
  }, []);

  return {
    timeEntries,
    setTimeEntries,
    reports,
    addManualEntry,
    deleteTimeEntry,
    editTimeEntry,
    updateEntryStatus,
    revertEntryStatus,
    submitTimesheetReport,
    unsubmitTimesheetReport,
    approveTimesheetReport,
    revertTimesheetReport
  };
}
