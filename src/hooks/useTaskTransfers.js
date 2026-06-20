/**
 * @file useTaskTransfers.js
 * @description Domain hook managing request workflows and reviews for transferring task ownership between employees.
 */

import { useState, useCallback } from 'react';

export function useTaskTransfers({
  currentUser,
  tasks = [],
  users = [],
  onUpdateTask,
  onAddNotification
} = {}) {
  const [taskTransfers, setTaskTransfers] = useState([]);

  const requestTaskTransfer = useCallback((taskId, targetEmployeeId, reason) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const newReq = {
      id: `transfer-${Date.now()}`,
      taskId,
      taskNumber: taskObj.taskNumber,
      requestedBy: currentUser?.id,
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
    if (tlUser && onAddNotification) {
      onAddNotification({
        id: `notif-${Date.now()}`,
        recipientId: tlUser.id,
        type: "TRANSFER_REQUEST",
        title: "Task Transfer Request",
        message: `${currentUser?.name || 'Employee'} requested transfer of ${taskObj.taskNumber}.`,
        entityType: "TASK",
        entityId: taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }, [currentUser, tasks, users, onAddNotification]);

  const reviewTaskTransfer = useCallback(async (id, status, rejectionReason = '') => {
    const req = taskTransfers.find(r => r.id === id);
    if (!req) return;

    const approved = status === 'Approved';

    if (approved && onUpdateTask) {
      const task = tasks.find(t => t.id === req.taskId);
      if (task) {
        try {
          await onUpdateTask(req.taskId, {
            ...task,
            assignedTo: req.createdTo,
            status: 'Transferred'
          });
        } catch (err) {
          console.error("Failed to update task assignee on transfer review:", err);
        }
      }

      // Notify recipient
      if (req.createdTo !== 'unassigned' && onAddNotification) {
        const senderName = users.find(u => u.id === req.requestedBy)?.name || 'an employee';
        onAddNotification({
          id: `notif-${Date.now()}-recv`,
          recipientId: req.createdTo,
          type: "TASK_ASSIGNED",
          title: "Transferred Task Assigned",
          message: `Task ${req.taskNumber} has been reassigned to you from ${senderName}.`,
          entityType: "TASK",
          entityId: req.taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Notify sender
    if (onAddNotification) {
      onAddNotification({
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
      });
    }

    setTaskTransfers(prev => 
      prev.map(r => r.id === id ? {
        ...r,
        status,
        reviewedBy: currentUser?.id,
        reviewedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || null,
        managerComment: rejectionReason
      } : r)
    );
  }, [taskTransfers, currentUser, tasks, users, onUpdateTask, onAddNotification]);

  const revertTaskTransfer = useCallback(async (reqId) => {
    const req = taskTransfers.find(t => t.id === reqId);
    if (!req) return;

    if (req.status === 'Approved' && onUpdateTask) {
      const t = tasks.find(task => task.id === req.taskId);
      if (t) {
        try {
          await onUpdateTask(req.taskId, {
            ...t,
            assignedTo: req.requestedBy,
            status: 'In Progress'
          });
        } catch (err) {
          console.error("Failed to revert task transfer:", err);
        }
      }
    }

    setTaskTransfers(prev => 
      prev.map(r => r.id === reqId ? {
        ...r,
        status: 'Pending',
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        managerComment: ''
      } : r)
    );
  }, [taskTransfers, tasks, onUpdateTask]);

  return {
    taskTransfers,
    setTaskTransfers,
    requestTaskTransfer,
    reviewTaskTransfer,
    revertTaskTransfer
  };
}
