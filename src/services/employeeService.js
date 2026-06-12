import { api } from './api';

// Converts backend employee shape → frontend shape your components expect
function mapEmployee(emp) {
  return {
    id:                    emp.id,
    name:                  emp.name,
    employee_code:         emp.employeeCode,
    email:                 emp.workEmail,
    workEmail:             emp.workEmail,
    personalEmail:         emp.personalEmail || '',
    phone:                 emp.phone || '',
    designation:           emp.designation || 'General',
    department:            emp.designation || 'General',
    status:                mapStatus(emp.status),
    notification_preference: emp.notificationPreference || 'ALL',
    profileImage:          emp.profileImage || '',
    role:                  emp.roles?.[0] || 'Employee',
    roles:                 emp.roles || [],
  };
}

// Backend uses ACTIVE / INACTIVE / ON_LEAVE → frontend uses Active / Inactive / On Leave
function mapStatus(status) {
  const map = {
    'ACTIVE':   'Active',
    'INACTIVE': 'Inactive',
    'ON_LEAVE': 'On Leave',
  };
  return map[status] || status;
}

// Converts frontend shape → backend shape for create/update calls
function toBackendEmployee(data) {
  return {
    employeeCode:           data.employee_code,
    name:                   data.name,
    workEmail:              data.email || data.workEmail,
    personalEmail:          data.personalEmail || data.email || data.workEmail,
    phone:                  data.phone || '',
    designation:            data.designation || 'General',
    status:                 toBackendStatus(data.status),
    notificationPreference: data.notification_preference || 'ALL',
    profileImage:           data.profileImage || data.avatar || '',
    joiningDate:            data.joiningDate || new Date().toISOString().split('T')[0],
    roles:                  data.role ? [data.role] : ['Employee'],
    user: {
      password:             data.password || '',
    },
  };
}

function toBackendStatus(status) {
  const map = {
    'Active':   'ACTIVE',
    'Inactive': 'INACTIVE',
    'On Leave': 'ON_LEAVE',
  };
  return map[status] || 'ACTIVE';
}

export const employeeService = {

  // GET all employees
  getAll: async () => {
    const data = await api.get('/employees');
    return data.map(mapEmployee);
  },

  // GET single employee by id
  getById: async (id) => {
    const data = await api.get(`/employees/${id}`);
    return mapEmployee(data);
  },

  // POST create new employee
  create: async (empData) => {
    const body = toBackendEmployee(empData);
    const data = await api.post('/employees', body);
    return mapEmployee(data);
  },

  // PUT update employee
  update: async (id, empData) => {
    const body = toBackendEmployee(empData);
    const data = await api.put(`/employees/${id}`, body);
    return mapEmployee(data);
  },

  // DELETE employee — backend expects reason as plain string in body
  delete: async (id, reason = 'Removed by admin') => {
    return api.delete(`/employees/${id}`, reason);
  },

  // GET employee's teams
  getTeams: async (id) => {
    return api.get(`/employees/${id}/teams`);
  },

  // GET employee's projects
  getProjects: async (id) => {
    return api.get(`/employees/${id}/projects`);
  },

  // GET employee's tasks
  getTasks: async (id) => {
    return api.get(`/employees/${id}/tasks`);
  },

};