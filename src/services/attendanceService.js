import { api } from './api';

// Backend → Frontend shape
function mapRecord(record) {
  return {
    id:               record.id,
    employeeId:       record.employee?.id || null,
    date:             record.date || '',
    clockIn:          record.clockIn || null,
    clockOut:         record.clockOut || null,
    totalWorkHours:   record.totalWorkHours ? record.totalWorkHours.toString() : '0.00',
    totalBreakHours:  record.totalBreakHours ? record.totalBreakHours.toString() : '0.00',
    status:           mapStatus(record.status),
    clockStatus:      mapClockStatus(record.clockStatus),
  };
}

function mapStatus(s) {
  const map = {
    'PRESENT':  'Present',
    'ABSENT':   'Absent',
    'HALF_DAY': 'Half Day',
    'ON_LEAVE': 'On Leave',
  };
  return map[s] || (s || 'Present');
}

function mapClockStatus(s) {
  const map = {
    'CLOCKED_IN': 'Clocked In',
    'ON_BREAK':   'On Break',
    'OFFLINE':    'Offline',
  };
  return map[s] || (s || 'Offline');
}

export const attendanceService = {

  // GET all records
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await api.get(`/attendance${qs ? '?' + qs : ''}`);
    return data.map(mapRecord);
  },

  // GET by employee
  getByEmployee: async (employeeId) => {
    const data = await api.get(`/attendance/employee/${employeeId}`);
    return data.map(mapRecord);
  },

  // POST clock-in
  clockIn: async (employeeId) => {
    const data = await api.post('/attendance/clock-in', { employee: { id: employeeId } });
    return mapRecord(data);
  },

  // PATCH clock-out
  clockOut: async (employeeId) => {
    const data = await api.patch('/attendance/clock-out', { employee: { id: employeeId } });
    return mapRecord(data);
  },
};
