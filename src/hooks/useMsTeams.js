import { useQuery } from '@tanstack/react-query';
import { msTeamsService } from '../services/msTeamsService';

/**
 * Fetches available Microsoft Teams (Groups) from Graph via backend proxy.
 * Cached for 5 minutes since groups/channels change rarely.
 */
export function useMsTeamsGroups(options = {}) {
  return useQuery({
    queryKey: ['ms-teams-groups'],
    queryFn: () => msTeamsService.getGroups(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Fetches channels for a specific Microsoft Team from Graph via backend proxy.
 * Automatically disabled until a groupId is provided (dependent dropdown pattern).
 * Cached for 5 minutes.
 */
export function useMsTeamsChannels(groupId, options = {}) {
  return useQuery({
    queryKey: ['ms-teams-channels', groupId],
    queryFn: () => msTeamsService.getChannels(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}
