/**
 * useEmployees — TanStack Query hook for the Employees domain.
 *
 * Replaces the useEffect + useState fetch pattern in AppContext for employees.
 * Provides: data, loading, error, and mutation helpers (create, update, delete)
 * that automatically invalidate the cache on success.
 *
 * Usage:
 *   const { employees, isLoading, error, createEmployee, updateEmployee, removeEmployee } = useEmployees();
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';

export const EMPLOYEES_KEY = ['employees'];

// ─── Query ───────────────────────────────────────────────────────────────────

export function useEmployees(options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: employeeService.getAll,
    ...options,
  });

  // ─── Create ───────────────────────────────────────────────────────────────
  const createEmployee = useMutation({
    mutationFn: (empData) => employeeService.create(empData),
    onSuccess: (created) => {
      // Optimistically append to cache — no need for a full refetch
      queryClient.setQueryData(EMPLOYEES_KEY, (prev = []) => [...prev, created]);
    },
    onError: (err) => {
      console.error('Failed to create employee:', err);
    },
  });

  // ─── Update ───────────────────────────────────────────────────────────────
  const updateEmployee = useMutation({
    mutationFn: ({ id, data }) => employeeService.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(EMPLOYEES_KEY, (prev = []) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );
    },

    onSuccess:()=>{
      queryClient.invalidateQueries({queryKey:EMPLOYEES_KEY})
    },
    onError: (err) => {
      console.error('Failed to update employee:', err);
    },
  });

  // ─── Delete ───────────────────────────────────────────────────────────────
  const removeEmployee = useMutation({
    mutationFn: ({ id, reason }) => employeeService.delete(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.setQueryData(EMPLOYEES_KEY, (prev = []) =>
        prev.filter((e) => e.id !== id)
      );
    },
    onError: (err) => {
      console.error('Failed to delete employee:', err);
    },
  });

  return {
    // Data
    employees: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,

    // Mutations (call .mutateAsync() for promise-based usage)
    createEmployee,
    updateEmployee,
    removeEmployee,

    // Expose queryClient for manual invalidation if needed
    invalidate: () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_KEY }),
  };
}
