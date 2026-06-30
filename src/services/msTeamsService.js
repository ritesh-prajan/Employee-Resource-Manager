import { api } from './api';

export const msTeamsService = {
  /**
   * GET available Microsoft Teams (Groups) from Graph via backend proxy.
   * Requires TEAM_CREATE permission (Admin / Team Lead only).
   * @returns {Promise<Array<{id: string, displayName: string}>>}
   */
  getGroups: async () => {
    return api.get('/ms-teams/groups');
  },

  /**
   * GET channels for a specific Microsoft Team from Graph via backend proxy.
   * Requires TEAM_CREATE permission (Admin / Team Lead only).
   * @param {string} groupId - The Microsoft Teams group ID
   * @returns {Promise<Array<{id: string, displayName: string}>>}
   */
  getChannels: async (groupId) => {
    return api.get(`/ms-teams/groups/${groupId}/channels`);
  },
};
