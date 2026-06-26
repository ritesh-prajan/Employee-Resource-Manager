/**
 * @file useTimeEntries.js
 * @description Domain hook for employee daily time logs and weekly timesheet compliance reports, using purely local state.
 */

import { useState } from 'react';
import { useQueries,useQueryClient,useMutation, useQuery } from '@tanstack/react-query';
import { timesheetService } from '#services/timesheetService.js';
export const TIMESHEET_KEY=['timesheets'];

export function useTimeEntries(params={}) {
  const queryclient=useQueryClient();
  const query=useQuery({
    queryKey:[...TIMESHEET_KEY,params],
    queryFn:()=>timesheetService.getAll(params),
  })
  const addManualEntry=useMutation({
    mutationFn:(entrydata)=>timesheetService.create(entrydata),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TIMESHEET_KEY});
      queryclient.invalidateQueries({queryKey: ['tasks']});
    },
    onError:(err)=>console.error('Failed to create timesheet entry',err),
  });
  const updateEntryStatus=useMutation({
    mutationFn:({id,status,managerComment=''})=>
      timesheetService.updateStatus(id,status,managerComment),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TIMESHEET_KEY});
      queryclient.invalidateQueries({queryKey: ['tasks']});
    },
    onError:(err)=>console.error('failed to update entry status',err),
  });
  const deleteTimeEntry=useMutation({
    mutationFn:(id)=>timesheetService.delete(id),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:TIMESHEET_KEY});
      queryclient.invalidateQueries({queryKey: ['tasks']});
    },
    onError:(err)=> console.error('Failed to delete timesheet entry',err)
  })

  return{
    timeEntries:query.data??[],
    reports: [],
    isLoading:query.isLoading,
    isFetching:query.isFetching,
    isError:query.isError,
    error:query.error,
    addManualEntry,
    updateEntryStatus,
    deleteTimeEntry,
    invalidate:()=>queryclient.invalidateQueries({queryKey:TIMESHEET_KEY})
  }
}
