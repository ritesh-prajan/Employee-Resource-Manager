import { api } from './api';

// Backend → Frontend shape
function mapTask(task) {
  return {
    id:               task.id,
    taskNumber:       task.taskNumber,
    // frontend uses 'name', backend uses 'title'
    name:             task.title,
    title:            task.title,
    description:      task.description || '',
    taskType:         task.taskType,
    type:             mapTaskType(task.taskType),
    priority:         mapPriority(task.priority),
    status:           mapStatus(task.status),
    etaHours:         task.etaHours || 0,
    eta:              task.etaHours || 0,
    etaDate:          task.etaDate || '',
    originalEtaDate:  task.originalEtaDate || '',
    extendedEtaDate:  task.extendedEtaDate || '',
    bugNumber:        task.bugNumber || '',
    epic:             task.epic || '',
    // assignedTo — backend returns full Employee object, frontend expects id
    assignedTo:       task.assignedTo?.id || null,
    assignedToObj:    task.assignedTo || null,
    // project — backend returns full Project object, frontend expects id
    projectId:        task.project?.id || null,
    projectObj:       task.project || null,
    // mock data compat
    logged:           0,
  };
}

// Backend taskType enums → frontend display labels
function mapTaskType(type) {
  const map = {
    'FEATURE': 'Feature',
    'BUG':     'Bug',
    'STORY':   'Story',
    'RND':     'R&D',
    'CRC':     'CRC',
    'COC':     'COC',
    'SUPPORT': 'Support',
    'TASK':    'Task',
    'POC':     'POC',
  };
  return map[type] || type;
}

// Backend priority enums → frontend display labels
function mapPriority(priority) {
  const map = {
    'LOW':      'Low',
    'MEDIUM':   'Medium',
    'HIGH':     'High',
    'CRITICAL': 'Critical',
  };
  return map[priority] || priority;
}

// Backend status enums → frontend display labels
function mapStatus(status) {
  const map = {
    'OPEN':            'Open',
    'IN_PROGRESS':     'In Progress',
    'PENDING_REVIEW':  'Pending Review',
    'COMPLETED':       'Completed',
    'OVER_ETA':        'Over ETA',
    'TRANSFERRED':     'Transferred',
    'ETA_EXTENDED':    'ETA Extended',
    'REJECTED':        'Rejected',
  };
  return map[status] || status;
}

// Frontend → Backend priority
function toBackendPriority(priority) {
  const map = {
    'Low':      'LOW',
    'Medium':   'MEDIUM',
    'High':     'HIGH',
    'Critical': 'CRITICAL',
  };
  return map[priority] || (priority ? priority.toUpperCase() : 'MEDIUM');
}

// Frontend → Backend status
function toBackendStatus(status) {
  const map = {
    'Open':           'OPEN',
    'In Progress':    'IN_PROGRESS',
    'Pending Review': 'PENDING_REVIEW',
    'Completed':      'COMPLETED',
    'Over ETA':       'OVER_ETA',
    'Transferred':    'TRANSFERRED',
    'ETA Extended':   'ETA_EXTENDED',
    'Rejected':       'REJECTED',
  };
  return map[status] || (status ? status.toUpperCase() : 'OPEN');
}

// Frontend → Backend task shape for create
function toBackendTask(data) {
  const body = {
    taskNumber: data.taskNumber,
    title:      data.title || data.name,
    description: data.description || '',
    project:    { id: data.projectId || data.project?.id },
    taskType:   data.taskType || 'TASK',
    priority:   toBackendPriority(data.priority),
    status:     toBackendStatus(data.status),
    etaHours:   data.etaHours || data.eta || 0,
    etaDate:    data.etaDate,
    epic:       data.epic || '',
  };

  // Only include assignedTo if provided
  if (data.assignedTo || data.assignedToId) {
    body.assignedTo = { id: data.assignedTo || data.assignedToId };
  }

  // Only include bugNumber if task type is BUG
  if ((data.taskType || '').toUpperCase() === 'BUG') {
    body.bugNumber = data.bugNumber || '';
  }

  return body;
}

export const taskService = {

  // GET all tasks
  getAll: async () => {
    const data = await api.get('/tasks');
    return data.map(mapTask);
  },

  // GET single task
  getById: async (id) => {
    const data = await api.get(`/tasks/${id}`);
    return mapTask(data);
  },

  // POST create task
  create: async (taskData) => {
    const body = toBackendTask(taskData);
    const data = await api.post('/tasks', body);
    return mapTask(data);
  },

  // PATCH update task — uses PATCH not PUT!
  update: async (id, taskData) => {
    const body = toBackendTask(taskData);
    const data = await api.patch(`/tasks/${id}`, body);
    return mapTask(data);
  },

  // DELETE task — body = reason string
  delete: async (id, reason = 'Removed by admin') => {
    return api.delete(`/tasks/${id}`, reason);
  },

  // PATCH unassign employee from task
  unassign: async (id) => {
    return api.patch(`/tasks/${id}/unassign`);
  },

  // GET backlog tasks (assignedTo is null)
  getBacklog: async () => {
    const data = await api.get('/tasks');
    return data
      .filter(t => !t.assignedTo)
      .map(mapTask);
  },

  // GET tasks by project
  getByProject: async (projectId) => {
    const data = await api.get('/tasks');
    return data
      .filter(t => t.project?.id === projectId)
      .map(mapTask);
  },

  // GET comments for a task
  getComments: async (taskId) => {
    return api.get(`/tasks/${taskId}/comments`);
  },

  // POST add comment
  addComment: async (taskId, authorEmployeeId, commentText) => {
    return api.post('/task-comments', {
      task:        { id: taskId },
      author:      { id: authorEmployeeId },
      commentText,
    });
  },

  // DELETE comment
  deleteComment: async (commentId) => {
    return api.delete(`/task-comments/${commentId}`);
  },

};