import { useCallback } from 'react';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';

export function useDomainActions({
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
}) {

  const addTaskComment = useCallback(async (taskId, commentText) => {
    try {
      await mutateAddTaskComment.mutateAsync({
        taskId,
        authorEmployeeId: auth.currentUser?.id,
        commentText
      });
      
      const task = tasks.find(t => t.id === taskId);
      if (task && task.assignedTo && String(task.assignedTo) !== String(auth.currentUser?.id)) {
        handleAddNotification({
          id: `notif-${Date.now()}`,
          recipientId: task.assignedTo,
          type: "TASK_COMMENTED",
          title: "New Comment on Task",
          message: `${auth.currentUser?.name} commented on task ${task.taskNumber || 'Task'}: "${commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText}"`,
          entityType: "TASK",
          entityId: taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Failed to add task comment:', err);
    }
  }, [mutateAddTaskComment, auth.currentUser?.id, tasks, handleAddNotification, auth.currentUser?.name]);

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
      toast.error('Failed to create project: ' + err.message);
    }
  }, [mutateCreateProject, mutateAddProjectMember, toast]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await mutateRemoveProject.mutateAsync(projectId);
    } catch (err) {
      console.error('Failed to delete project:', err);
      toast.error('Failed to delete project: ' + err.message);
    }
  }, [mutateRemoveProject, toast]);

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
      toast.error('Failed to create task: ' + err.message);
    }
  }, [mutateCreateTask, users, auth.currentUser?.name, handleAddNotification, toast]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await mutateRemoveTask.mutateAsync(taskId);
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task: ' + err.message);
    }
  }, [mutateRemoveTask, toast]);

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
          try {
            await mutateAddTeamMember.mutateAsync({ teamId: created.id, userId: memberId });
          } catch (memberErr) {
            console.error(`Failed to add member ${memberId} to team:`, memberErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to create team:', err);
      toast.error('Failed to create team: ' + err.message);
    }
  }, [mutateCreateTeam, rawUsers, mutateUpdateEmployee, mutateAddTeamMember, toast]);

  const deleteTeam = useCallback(async (teamId) => {
    try {
      await mutateRemoveTeam.mutateAsync(teamId);
    } catch (err) {
      console.error('Failed to delete team:', err);
      toast.error('Failed to delete team: ' + err.message);
    }
  }, [mutateRemoveTeam, toast]);

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
          try {
            await mutateRemoveTeamMember.mutateAsync({ teamId, userId: id });
          } catch (memberErr) {
            console.error(`Failed to remove member ${id} from team:`, memberErr);
          }
        }
      }
      for (const id of newIds) {
        if (!existingIds.includes(id)) {
          try {
            await mutateAddTeamMember.mutateAsync({ teamId, userId: id });
          } catch (memberErr) {
            console.error(`Failed to add member ${id} to team:`, memberErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update team:', err);
      toast.error('Failed to update team: ' + err.message);
    }
  }, [mutateUpdateTeam, rawUsers, mutateUpdateEmployee, mutateRemoveTeamMember, mutateAddTeamMember, toast]);

  const editProject = useCallback(async (projectId, updatedData) => {
    try {
      await mutateUpdateProject.mutateAsync({ id: projectId, data: updatedData });
      const existingMembers = await projectService.getMembers(projectId);
      const existingIds = existingMembers.map(m => m.id);
      const newIds = updatedData.members || [];
      for (const id of existingIds) {
        if (!newIds.includes(id)) {
          try {
            await mutateRemoveProjectMember.mutateAsync({ projectId, userId: id });
          } catch (memberErr) {
            console.error(`Failed to remove member ${id} from project:`, memberErr);
          }
        }
      }
      for (const id of newIds) {
        if (!existingIds.includes(id)) {
          try {
            await mutateAddProjectMember.mutateAsync({ projectId, userId: id });
          } catch (memberErr) {
            console.error(`Failed to add member ${id} to project:`, memberErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      toast.error('Failed to update project: ' + err.message);
    }
  }, [mutateUpdateProject, mutateRemoveProjectMember, mutateAddProjectMember, toast]);

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

  const editTask = useCallback(async (taskId, updatedData) => {
    try {
      const originalTask = tasks.find(t => t.id === taskId);
      await mutateUpdateTask.mutateAsync({ id: taskId, data: updatedData });

      if (originalTask) {
        const diffMessages = [];

        if (updatedData.name !== undefined && originalTask.name !== updatedData.name) {
          diffMessages.push(`Title: "${originalTask.name}" → "${updatedData.name}"`);
        }
        if (updatedData.projectId !== undefined && String(originalTask.projectId) !== String(updatedData.projectId)) {
          const oldProjName = projects.find(p => String(p.id) === String(originalTask.projectId))?.name.split(' (')[0] || 'Unknown';
          const newProjName = projects.find(p => String(p.id) === String(updatedData.projectId))?.name.split(' (')[0] || 'Unknown';
          diffMessages.push(`Project: ${oldProjName} → ${newProjName}`);
        }
        if (updatedData.assignedTo !== undefined && String(originalTask.assignedTo || '') !== String(updatedData.assignedTo || '')) {
          const oldUserName = users.find(u => String(u.id) === String(originalTask.assignedTo || ''))?.name || 'Unassigned';
          const newUserName = users.find(u => String(u.id) === String(updatedData.assignedTo || ''))?.name || 'Unassigned';
          diffMessages.push(`Assignee: ${oldUserName} → ${newUserName}`);
        }
        if (updatedData.eta !== undefined && Number(originalTask.eta) !== Number(updatedData.eta)) {
          diffMessages.push(`Estimate: ${originalTask.eta}h → ${updatedData.eta}h`);
        }
        if (updatedData.type !== undefined && originalTask.type !== updatedData.type) {
          diffMessages.push(`Type: ${originalTask.type} → ${updatedData.type}`);
        }
        if (updatedData.epic !== undefined && originalTask.epic !== updatedData.epic) {
          diffMessages.push(`Epic: ${originalTask.epic || 'None'} → ${updatedData.epic || 'None'}`);
        }
        if (updatedData.priority !== undefined && originalTask.priority !== updatedData.priority) {
          diffMessages.push(`Priority: ${originalTask.priority} → ${updatedData.priority}`);
        }
        if (updatedData.status !== undefined && originalTask.status !== updatedData.status) {
          diffMessages.push(`Status: ${originalTask.status} → ${updatedData.status}`);
        }

        const parseToIso = (val) => {
          if (!val) return null;
          const d = new Date(val);
          if (isNaN(d.getTime())) return null;
          return d.toISOString();
        };

        const formatDate = (val) => {
          if (!val) return 'None';
          const d = new Date(val);
          if (isNaN(d.getTime())) return 'None';
          return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        };

        if (updatedData.hasOwnProperty('etaDate')) {
          const oldEtaDateStr = parseToIso(originalTask.etaDate);
          const newEtaDateStr = parseToIso(updatedData.etaDate);
          if (oldEtaDateStr !== newEtaDateStr) {
            diffMessages.push(`ETA Date: ${formatDate(originalTask.etaDate)} → ${formatDate(updatedData.etaDate)}`);
          }
        }

        if (diffMessages.length > 0) {
          const systemComment = `[Task Edited]: ${diffMessages.join('; ')}`;
          await addTaskComment(taskId, systemComment);
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task: ' + err.message);
    }
  }, [mutateUpdateTask, tasks, projects, users, addTaskComment, toast]);

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
      toast.error('Failed to update task progress: ' + err.message);
    }
  }, [tasks, auth.currentUser?.id, mutateUpdateTaskProgress, mutateUpdateTask, addTaskComment, toast]);

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
      toast.error('Failed to submit task for review: ' + err.message);
    }
  }, [tasks, mutateUpdateTask, users, auth.currentUser?.name, handleAddNotification, toast]);

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
      toast.error('Failed to resolve task completion: ' + err.message);
    }
  }, [tasks, mutateUpdateTask, auth.currentUser?.name, handleAddNotification, addTaskComment, toast]);

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

      const currentUserId = auth.currentUser?.id;
      const proj = projects.find(p => p.id === taskObj.projectId);
      const isMember = proj ? (proj.members || []).some(mId => String(mId) === String(currentUserId)) : false;

      if (currentUserId) {
        if (!isMember) {
          try {
            await mutateAddProjectMember.mutateAsync({ projectId: taskObj.projectId, userId: currentUserId });
          } catch (addErr) {
            console.warn("Could not auto-add user to project:", addErr);
          }
        }
      }

      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: {
          ...taskObj,
          assignedTo: currentUserId,
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
      const projObj = projects.find(p => p.id === taskObj.projectId);
      if (projObj && projObj.teams) {
        const projectTeams = teams.filter(t => projObj.teams.includes(t.id));
        const notifiedLeadIds = new Set(admins.map(a => a.id));
        projectTeams.forEach(team => {
          if (team.leadId && !notifiedLeadIds.has(team.leadId) && String(team.leadId) !== String(auth.currentUser?.id)) {
            notifiedLeadIds.add(team.leadId);
            handleAddNotification({
              id: `notif-${Date.now()}-${team.leadId}`,
              recipientId: team.leadId,
              type: "BACKLOG_CLAIMED",
              title: "Backlog Task Claimed",
              message: `${auth.currentUser?.name} has claimed backlog task ${taskObj.taskNumber}: ${taskObj.name} from project ${projObj.name.split(' (')[0]}.`,
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
      toast.error('Failed to claim backlog task: ' + err.message);
    }
  }, [tasks, auth.currentUser?.id, auth.currentUser?.name, users, projects, teams, handleAddNotification, mutateUpdateTask, mutateAddProjectMember, toast]);

  const requestClaimBacklogTask = useCallback(async (taskId) => {
    try {
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) return;

      const proj = projects.find(p => p.id === taskObj.projectId);
      const projectTeams = teams.filter(t => (proj?.teams || []).includes(t.id));
      let leadIds = projectTeams.map(t => t.leadId).filter(Boolean);
      
      if (leadIds.length === 0) {
        leadIds = users.filter(u => u.role === 'Admin').map(u => u.id);
      }

      leadIds.forEach(leadId => {
        handleAddNotification({
          id: `claim-req-${Date.now()}-${leadId}-${taskId}`,
          recipientId: leadId,
          senderId: auth.currentUser?.id,
          senderName: auth.currentUser?.name,
          type: "BACKLOG_CLAIM_REQUEST",
          title: "Backlog Claim Request",
          message: `${auth.currentUser?.name} has requested to claim backlog task ${taskObj.taskNumber}: ${taskObj.name}.`,
          entityType: "TASK",
          entityId: taskId,
          channel: "IN_APP",
          isRead: false,
          createdAt: new Date().toISOString()
        });
      });

      toast.success("Claim request sent to your Team Lead/Admin successfully!");
    } catch (err) {
      console.error("Failed to request task claim:", err);
      toast.error("Failed to send claim request: " + err.message);
    }
  }, [tasks, projects, teams, users, auth.currentUser?.id, auth.currentUser?.name, handleAddNotification, toast]);

  const approveClaimRequest = useCallback(async (notif) => {
    try {
      const taskId = notif.entityId;
      const taskObj = tasks.find(t => t.id === taskId);
      if (!taskObj) {
        toast.error("Task not found.");
        return;
      }

      const proj = projects.find(p => p.id === taskObj.projectId);
      const isMember = proj ? (proj.members || []).some(mId => String(mId) === String(notif.senderId)) : false;

      if (notif.senderId) {
        if (!isMember) {
          try {
            await mutateAddProjectMember.mutateAsync({ projectId: taskObj.projectId, userId: notif.senderId });
          } catch (addErr) {
            console.warn("Could not auto-add claim request sender to project:", addErr);
          }
        }
      }

      await mutateUpdateTask.mutateAsync({
        id: taskId,
        data: {
          ...taskObj,
          assignedTo: notif.senderId,
          status: 'In Progress'
        }
      });

      notificationsHook.deleteNotification(notif.id);

      handleAddNotification({
        id: `notif-${Date.now()}-${notif.senderId}`,
        recipientId: notif.senderId,
        type: "TASK_ASSIGNED",
        title: "Claim Request Approved",
        message: `Your request to claim backlog task ${taskObj.taskNumber}: ${taskObj.name} has been approved.`,
        entityType: "TASK",
        entityId: taskId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      toast.success(`Claim request approved! Task has been assigned.`);
    } catch (err) {
      console.error("Failed to approve claim request:", err);
      toast.error("Failed to approve request: " + err.message);
    }
  }, [tasks, mutateUpdateTask, handleAddNotification, notificationsHook, projects, mutateAddProjectMember, toast]);

  const rejectClaimRequest = useCallback(async (notif) => {
    try {
      notificationsHook.deleteNotification(notif.id);

      const taskObj = tasks.find(t => t.id === notif.entityId) || { taskNumber: '', name: 'Task' };

      handleAddNotification({
        id: `notif-${Date.now()}-${notif.senderId}`,
        recipientId: notif.senderId,
        type: "TASK_REJECTED",
        title: "Claim Request Rejected",
        message: `Your request to claim backlog task ${taskObj.taskNumber}: ${taskObj.name} has been rejected.`,
        entityType: "TASK",
        entityId: notif.entityId,
        channel: "IN_APP",
        isRead: false,
        createdAt: new Date().toISOString()
      });

      toast.success(`Claim request rejected.`);
    } catch (err) {
      console.error("Failed to reject claim request:", err);
      toast.error("Failed to reject request: " + err.message);
    }
  }, [tasks, handleAddNotification, notificationsHook, toast]);

  return {
    createProject,
    deleteProject,
    editProject,
    createTask,
    deleteTask,
    editTask,
    updateTaskProgress,
    addTaskComment,
    addEmployee,
    deleteEmployee,
    editEmployee,
    createTeam,
    deleteTeam,
    editTeam,
    submitTaskForReview,
    approveTaskCompletion,
    revertTaskCompletion,
    claimBacklogTask,
    requestClaimBacklogTask,
    approveClaimRequest,
    rejectClaimRequest
  };
}
