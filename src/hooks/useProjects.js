import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/projectService';

export const PROJECTS_KEY = ['projects'];

export function useProjects(options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: async () => {
      const data = await projectService.getAll();
      const projectsWithMembers = await Promise.all(
        data.map(async (proj) => {
          try {
            const members = await projectService.getMembers(proj.id);
            return { ...proj, members: members.map((m) => m.id ?? m) };
          } catch (err) {
            console.error(`Failed to fetch members for project ${proj.id}:`, err);
            return { ...proj, members: [] };
          }
        })
      );
      return projectsWithMembers;
    },
    ...options,
  });

  const createProject = useMutation({
    mutationFn: (data) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (err) => console.error('Failed to create project:', err),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (err) => console.error('Failed to update project:', err),
  });

  const removeProject = useMutation({
    mutationFn: (id) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (err) => console.error('Failed to delete project:', err),
  });

  const addProjectMember = useMutation({
    mutationFn: ({ projectId, userId }) => projectService.addMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (err) => console.error('Failed to add project member:', err),
  });

  const removeProjectMember = useMutation({
    mutationFn: ({ projectId, userId }) => projectService.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (err) => console.error('Failed to remove project member:', err),
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createProject,
    updateProject,
    removeProject,
    addProjectMember,
    removeProjectMember,
    invalidate: () => queryClient.invalidateQueries({ queryKey: PROJECTS_KEY }),
  };
}
