import { api } from './api';

// Backend → Frontend shape
function mapProject(proj) {
  return {
    id:                 proj.id ? Number(proj.id) : proj.id,
    name:               proj.projectName,
    projectName:        proj.projectName,
    description:        proj.description || '',
    client:             proj.clientName,
    clientName:         proj.clientName,
    color:              proj.colorHex || '#8ECAE6',
    colorHex:           proj.colorHex || '#8ECAE6',
    startDate:          proj.startDate || '',
    endDate:            proj.endDate || '',
    status:             mapStatus(proj.status),
    progressPercentage: proj.progressPercentage || 0,
    members:            [],  // loaded separately via getMembers()
    teams:              [],  // not in backend yet
  };
}

// Backend status → Frontend status
function mapStatus(status) {
  const map = {
    'ACTIVE':    'Active',
    'ON_HOLD':   'On Hold',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };
  return map[status] || status;
}

// Frontend → Backend shape
function toBackendProject(data) {
  return {
    projectName:        data.name || data.projectName,
    description:        data.description || '',
    clientName:         data.client || data.clientName || 'Internal',
    colorHex:           data.color || data.colorHex || '#8ECAE6',
    startDate:          data.startDate || new Date().toISOString().split('T')[0],
    endDate:            data.endDate || null,
    status:             toBackendStatus(data.status),
    progressPercentage: data.progressPercentage || 0,
  };
}

function toBackendStatus(status) {
  const map = {
    'Active':    'ACTIVE',
    'On Hold':   'ON_HOLD',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED',
  };
  return map[status] || 'ACTIVE';
}

export const projectService = {

  // GET all projects
  getAll: async () => {
    const data = await api.get('/projects');
    return data.map(mapProject);
  },

  // GET single project
  getById: async (id) => {
    const data = await api.get(`/projects/${id}`);
    return mapProject(data);
  },

  // POST create project
  create: async (projData) => {
    const body = toBackendProject(projData);
    const data = await api.post('/projects', body);
    return mapProject(data);
  },

  // PUT update project
  update: async (id, projData) => {
    const body = toBackendProject(projData);
    const data = await api.put(`/projects/${id}`, body);
    return mapProject(data);
  },

  // DELETE project — body = reason string
  delete: async (id, reason = 'Removed by admin') => {
    return api.delete(`/projects/${id}`, reason);
  },

  // GET all members of a project
  getMembers: async (projectId) => {
    return api.get(`/projects/${projectId}/employees`);
  },

  // POST add an employee to a project
  addMember: async (projectId, employeeId) => {
    return api.post(`/projects/${projectId}/employees/${employeeId}`);
  },

  // DELETE remove an employee from a project
  removeMember: async (projectId, employeeId) => {
    return api.delete(`/projects/${projectId}/employees/${employeeId}`);
  },

};