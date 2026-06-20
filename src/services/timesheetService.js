import { api } from './api';

// Backend → Frontend shape
function mapEntry(entry) {
  return {
    id:            entry.id,
    employeeId:    entry.employee?.id || null,
    taskId:        entry.task?.id || null,
    projectId:     entry.project?.id || null,
    date:          entry.date || '',
    startTime:     entry.startTime || '',
    endTime:       entry.endTime || '',
    duration:      entry.durationHours ? entry.durationHours.toString() : '0',
    durationHours: entry.durationHours || 0,
    workCategory:  mapCategory(entry.workCategory),
    description:   entry.description || '',
    justification: entry.justification || '',
    status:        mapStatus(entry.status),
    managerComment: entry.managerComment || '',
  };
}

function mapStatus(status) {
  const map = {
    'PENDING':  'Pending',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
  };
  return map[status] || status;
}

function mapCategory(cat) {
  const map = {
    'STORY':   'Story',
    'BUG':     'Bug',
    'FEATURE': 'Feature',
    'SUPPORT': 'Support',
    'MEETING': 'Meeting',
    'ADMIN':   'Admin',
  };
  return map[cat] || (cat || 'Story');
}

function toBackendCategory(cat) {
  const map = {
    'Story':   'STORY',
    'Bug':     'BUG',
    'Feature': 'FEATURE',
    'Support': 'SUPPORT',
    'Meeting': 'MEETING',
    'Admin':   'ADMIN',
  };
  return map[cat] || (cat ? cat.toUpperCase() : 'STORY');
}

export const timesheetService = {

  // GET all entries (optionally filtered)
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await api.get(`/timesheets${qs ? '?' + qs : ''}`);
    return data.map(mapEntry);
  },

  // GET by employee
  getByEmployee: async (employeeId) => {
    const data = await api.get(`/timesheets?employeeId=${employeeId}`);
    return data.map(mapEntry);
  },

  // POST create entry
  create: async (entryData) => {
    const body = {
      employee:     { id: entryData.employeeId || entryData.userId },
      task:         entryData.taskId    ? { id: entryData.taskId }    : null,
      project:      entryData.projectId ? { id: entryData.projectId } : null,
      date:         entryData.date,
      startTime:    entryData.startTime,
      endTime:      entryData.endTime,
      durationHours: parseFloat(entryData.duration || entryData.durationHours || 0),
      workCategory:  toBackendCategory(entryData.workCategory),
      description:   entryData.description || '',
      justification: entryData.justification || '',
    };
    const data = await api.post('/timesheets', body);
    return mapEntry(data);
  },

  // PATCH update status (approve / reject)
  updateStatus: async (id, status, managerComment = '') => {
    const data = await api.patch(`/timesheets/${id}/status`, {
      status: status.toUpperCase(),
      managerComment,
    });
    return mapEntry(data);
  },

  // DELETE entry
  delete: async (id) => {
    return api.delete(`/timesheets/${id}`);
  },
};
