import { api } from './api';

export const teamsService = {
  postMessage: async (title, message) => {
    return api.post('/teams-post', { title, message });
  },
};
