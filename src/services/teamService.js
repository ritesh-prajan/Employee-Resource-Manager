import { api } from './api';

// Backend → Frontend shape
function mapTeam(team) {
  return {
    id:              team.id,
    name:            team.teamName,
    teamName:        team.teamName,
    description:     team.description || '',
    leadId:          team.lead?.id || null,
    lead:            team.lead || null,
    subLeadId:       team.subLead?.id || null,
    subLead:         team.subLead || null,
    teamsChannelId:  team.teamsChannelId || '',
    status:          mapStatus(team.status),
    members:         [], // loaded separately via getMembers()
  };
}

function mapStatus(status) {
  const map = {
    'ACTIVE':   'Active',
    'INACTIVE': 'Inactive',
  };
  return map[status] || status;
}

// Frontend → Backend shape
function toBackendTeam(data) {
  return {
    teamName:       data.name || data.teamName,
    description:    data.description || '',
    lead:           data.leadId ? { id: data.leadId } : null,
    subLead:        data.subLeadId ? { id: data.subLeadId } : null,
    teamsChannelId: data.teamsChannelId || '',
    status:         toBackendStatus(data.status),
  };
}

function toBackendStatus(status) {
  const map = {
    'Active':   'ACTIVE',
    'Inactive': 'INACTIVE',
  };
  return map[status] || 'ACTIVE';
}

export const teamService = {

  // GET all teams
  getAll: async () => {
    const data = await api.get('/teams');
    return data.map(mapTeam);
  },

  // GET single team
  getById: async (id) => {
    const data = await api.get(`/teams/${id}`);
    return mapTeam(data);
  },

  // POST create team
  create: async (teamData) => {
  const body = toBackendTeam(teamData);
  console.log('CREATE TEAM BODY:', JSON.stringify(body)); // add this
  const data = await api.post('/teams', body);
  return mapTeam(data);
},

  // PUT update team
  update: async (id, teamData) => {
    const body = toBackendTeam(teamData);
    const data = await api.put(`/teams/${id}`, body);
    return mapTeam(data);
  },

  // DELETE team — body = reason string
  delete: async (id, reason = 'Removed by admin') => {
    return api.delete(`/teams/${id}`, reason);
  },

  // GET all members of a team
  getMembers: async (teamId) => {
    return api.get(`/teams/${teamId}/employees`);
  },

  // POST add employee to team
  addMember: async (teamId, employeeId) => {
    return api.post(`/teams/${teamId}/employees/${employeeId}`);
  },

  // DELETE remove employee from team
  removeMember: async (teamId, employeeId) => {
    return api.delete(`/teams/${teamId}/employees/${employeeId}`);
  },

};