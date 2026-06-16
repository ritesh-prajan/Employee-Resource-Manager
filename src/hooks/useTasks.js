import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';

export const TASKS_KEY = ['tasks'];

export function useTasks(options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const tasksData = await taskService.getAll();
      
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          try {
            const [comments, progressLogs] = await Promise.all([
              taskService.getComments(task.id),
              taskService.getProgress(task.id)
            ]);
            
            let latestProgress = 0;
            if (progressLogs && progressLogs.length > 0) {
              const sortedLogs = [...progressLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              latestProgress = sortedLogs[0]?.progressPercentage ?? 0;
            }
            
            return {
              ...task,
              progress: latestProgress,
              comments: comments || []
            };
          } catch (err) {
            console.error(`Failed to enrich task ${task.id}:`, err);
            return { ...task, progress: 0, comments: [] };
          }
        })
      );
      
      return enrichedTasks;
    },
    ...options,
  });

  const createTask = useMutation({
    mutationFn: (data) => taskService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to create task:', err),
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => taskService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to update task:', err),
  });

  const removeTask = useMutation({
    mutationFn: (id) => taskService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to delete task:', err),
  });

  const assignTask = useMutation({
    mutationFn: ({ taskId, userId }) => taskService.assignTask(taskId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to assign task:', err),
  });

  const unassignTask = useMutation({
    mutationFn: (taskId) => taskService.unassignTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to unassign task:', err),
  });

  const addTaskComment = useMutation({
    mutationFn: ({ taskId, authorEmployeeId, commentText }) => taskService.addComment(taskId, authorEmployeeId, commentText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to add comment:', err),
  });

  const updateTaskProgress = useMutation({
    mutationFn: ({ taskId, employeeId, progressPercentage, remarks }) => taskService.addProgress(taskId, employeeId, progressPercentage, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
    onError: (err) => console.error('Failed to update progress:', err),
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createTask,
    updateTask,
    removeTask,
    assignTask,
    unassignTask,
    addTaskComment,
    updateTaskProgress,
    invalidate: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  };
}
