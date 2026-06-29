import { api } from './api';

export const teamsService = {
  postMessage: async (title, message) => {
    return api.post('/feed/teams-post', { title, message });
  },
};
