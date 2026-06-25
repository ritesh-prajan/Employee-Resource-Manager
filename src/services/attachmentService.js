import { api } from './api';

export const attachmentService = {

  getByMeetingId: async (meetingId) => {
    return api.get(`/meetings/${meetingId}/attachments`);
  },

 
  upload: async (meetingId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const activeBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    
    const response = await fetch(`${activeBaseUrl}/attachments?meetingId=${meetingId}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Upload failed');
    }
    return response.json();
  },


  downloadUrl: (id) => {
    const activeBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    return `${activeBaseUrl}/attachments/${id}/download`;
  },

  delete: async (id) => {
    return api.delete(`/attachments/${id}`);
  }
};