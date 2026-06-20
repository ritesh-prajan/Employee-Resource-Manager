import { api } from './api';

// Backend → Frontend shape
function mapMeeting(meeting) {
  return {
    id:          meeting.id,
    title:       meeting.title,
    description: meeting.description || '',
    startTime:   meeting.startTime || '',
    endTime:     meeting.endTime || '',
    organizerId: meeting.organizer?.id || null,
    organizer:   meeting.organizer || null,
    attendees:   (meeting.attendees || []).map(a => a.id ?? a),
    meetingLink: meeting.meetingLink || '',
    status:      mapStatus(meeting.status),
  };
}

function mapStatus(s) {
  const map = {
    'SCHEDULED': 'Scheduled',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
  };
  return map[s] || (s || 'Scheduled');
}

function toBackendStatus(s) {
  const map = {
    'Scheduled': 'SCHEDULED',
    'Completed': 'COMPLETED',
    'Cancelled': 'CANCELLED',
  };
  return map[s] || (s ? s.toUpperCase() : 'SCHEDULED');
}

export const meetingService = {

  // GET all meetings
  getAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await api.get(`/meetings${qs ? '?' + qs : ''}`);
    return data.map(mapMeeting);
  },

  // GET single meeting
  getById: async (id) => {
    const data = await api.get(`/meetings/${id}`);
    return mapMeeting(data);
  },

  // POST create meeting
  create: async (meetingData) => {
    const body = {
      title:       meetingData.title,
      description: meetingData.description || '',
      startTime:   meetingData.startTime,
      endTime:     meetingData.endTime,
      organizer:   { id: meetingData.organizerId || meetingData.organizer?.id },
      meetingLink: meetingData.meetingLink || '',
      status:      toBackendStatus(meetingData.status || 'Scheduled'),
    };
    const data = await api.post('/meetings', body);
    return mapMeeting(data);
  },

  // PUT update meeting
  update: async (id, meetingData) => {
    const body = {
      title:       meetingData.title,
      description: meetingData.description || '',
      startTime:   meetingData.startTime,
      endTime:     meetingData.endTime,
      organizer:   meetingData.organizerId ? { id: meetingData.organizerId } : undefined,
      meetingLink: meetingData.meetingLink || '',
      status:      toBackendStatus(meetingData.status),
    };
    const data = await api.put(`/meetings/${id}`, body);
    return mapMeeting(data);
  },

  // DELETE meeting
  delete: async (id) => {
    return api.delete(`/meetings/${id}`);
  },

  // POST add attendee
  addAttendee: async (meetingId, employeeId) => {
    const data = await api.post(`/meetings/${meetingId}/attendees/${employeeId}`);
    return mapMeeting(data);
  },

  // DELETE remove attendee
  removeAttendee: async (meetingId, employeeId) => {
    const data = await api.delete(`/meetings/${meetingId}/attendees/${employeeId}`);
    return mapMeeting(data);
  },
};
