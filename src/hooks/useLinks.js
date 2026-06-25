/**
 * @file useLinks.js
 * @description React Query hooks for the Links (Knowledge) API.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import linkService from '../services/linkService';

const LINKS_KEY = ['links'];

/**
 * Fetch paginated & filterable links.
 * @param {Object} params - { filename, createdBy, createdAt, page, size, sortBy, sortDir }
 */
export function useLinks(params = {}) {
  return useQuery({
    queryKey: [...LINKS_KEY, params],
    queryFn: () => linkService.getAll(params),
    keepPreviousData: true,
  });
}

/** Create link mutation */
export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => linkService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_KEY }),
  });
}

/** Update link mutation */
export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => linkService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_KEY }),
  });
}

/** Delete link mutation */
export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => linkService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LINKS_KEY }),
  });
}
