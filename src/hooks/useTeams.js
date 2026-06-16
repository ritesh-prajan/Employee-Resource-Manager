import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamService } from '../services/teamService';

export const TEAMS_KEY = ['teams'];

export function useTeams(options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TEAMS_KEY,
    queryFn: async () => {
      const data = await teamService.getAll();
      const teamsWithMembers = await Promise.all(
        data.map(async (team) => {
          try {
            const members = await teamService.getMembers(team.id);
            return { ...team, members: members.map((m) => m.id) };
          } catch (err) {
            console.error(`Failed to fetch members for team ${team.id}:`, err);
            return { ...team, members: [] };
          }
        })
      );
      return teamsWithMembers;
    },
    ...options,
  });

  const createTeam = useMutation({
    mutationFn: (data) => teamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
    onError: (err) => console.error('Failed to create team:', err),
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, data }) => teamService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
    onError: (err) => console.error('Failed to update team:', err),
  });

  const removeTeam = useMutation({
    mutationFn: (id) => teamService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
    onError: (err) => console.error('Failed to delete team:', err),
  });

  const addTeamMember = useMutation({
    mutationFn: ({ teamId, userId }) => teamService.addMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
    onError: (err) => console.error('Failed to add team member:', err),
  });

  const removeTeamMember = useMutation({
    mutationFn: ({ teamId, userId }) => teamService.removeMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
    },
    onError: (err) => console.error('Failed to remove team member:', err),
  });

  return {
    teams: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createTeam,
    updateTeam,
    removeTeam,
    addTeamMember,
    removeTeamMember,
    invalidate: () => queryClient.invalidateQueries({ queryKey: TEAMS_KEY }),
  };
}
