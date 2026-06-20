/**
 * @file useETAExtensions.js
 * @description Domain hook managing request workflows and reviews for task ETA date extensions.
 */

import { useState, useCallback } from 'react';

export function useETAExtensions({
  currentUser,
  tasks = [],
  users = [],
  onUpdateTask,
  onAddNotification
} = {}) {
  const [etaExtensions, setEtaExtensions] = useState([]);

  const requestETAExtension = useCallback((taskId, newEta, reason) => {
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj) return;

    const newReq = {
      id: `eta-${Date.now()}`,
      taskId,
      taskNumber: taskObj.taskNumber,
      requestedBy: currentUser?.id,
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

    // Notify Lead
    const tlUser = users.find(u => u.role === 'Team Lead');
    if (tlUser && onAddNotification) {
      onAddNotification({
        id: `notif-${Date.now()}`,
        recipientId: tlUser.id,
        type: "ETA_REQUEST",
        title: "ETA Extension Request",
        message: `${currentUser?.name || 'Employee'} requested an ETA extension for ${taskObj.taskNumber}.`,
        entityType: "TASK",
        entityId: taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }
  }, [currentUser, tasks, users, onAddNotification]);

  const reviewETAExtension = useCallback(async (id, status, rejectionReason = '') => {
    const req = etaExtensions.find(e => e.id === id);
    if (!req) return;

    const approved = status === 'Approved';

    if (approved && onUpdateTask) {
      const task = tasks.find(t => t.id === req.taskId);
      if (task) {
        try {
          await onUpdateTask(req.taskId, {
            ...task,
            status: 'ETA_Extended',
            etaDate: req.newEta
          });
        } catch (err) {
          console.error("Failed to update task ETA on review:", err);
        }
      }
    }

    // Send notification
    if (onAddNotification) {
      onAddNotification({
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
      });
    }

    setEtaExtensions(prev => 
      prev.map(r => r.id === id ? {
        ...r,
        status,
        approvedBy: currentUser?.id,
        approvalDate: new Date().toISOString(),
        rejectionReason: rejectionReason || null,
        managerComment: rejectionReason
      } : r)
    );
  }, [etaExtensions, currentUser, tasks, onUpdateTask, onAddNotification]);

  const revertETAExtension = useCallback(async (reqId) => {
    const req = etaExtensions.find(e => e.id === reqId);
    if (!req) return;

    if (req.status === 'Approved' && onUpdateTask) {
      const t = tasks.find(task => task.id === req.taskId);
      if (t) {
        try {
          await onUpdateTask(req.taskId, {
            ...t,
            status: 'In Progress',
            etaDate: req.oldEta
          });
        } catch (err) {
          console.error("Failed to revert ETA extension:", err);
        }
      }
    }

    setEtaExtensions(prev => 
      prev.map(r => r.id === reqId ? {
        ...r,
        status: 'Pending',
        approvedBy: null,
        approvalDate: null,
        rejectionReason: null,
        managerComment: ''
      } : r)
    );
  }, [etaExtensions, tasks, onUpdateTask]);

  return {
    etaExtensions,
    setEtaExtensions,
    requestETAExtension,
    reviewETAExtension,
    revertETAExtension
  };
}
