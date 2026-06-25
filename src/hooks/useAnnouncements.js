import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementService } from '../services/announcementService';
import { useToast } from '../components/ui/Toast';
export const ANNOUNCEMENTS_KEY = ['announcements'];

import React from 'react'

export function useAnnouncements({currentUser,users=[],onAddNotification}={}) {
  const queryclient=useQueryClient();
  const toast = useToast();

  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ANNOUNCEMENTS_KEY,
    queryFn: () => announcementService.getAll(),
  });


  const createAnnouncement=useMutation({
    mutationFn:(annData)=>announcementService.create(annData),
    onSuccess:(newAnn)=>{
      queryclient.invalidateQueries({queryKey:ANNOUNCEMENTS_KEY})
      if(onAddNotification&&users){
        users.forEach(u=>{
          if(currentUser&&String(u.id)!==String(currentUser.id)){
            onAddNotification({
              id:`notif-${Date.now()}-${u.id}`,
              recipientId:u.id,
              type:'ANNOUNCEMENT',
              title:"New Company Announcement",
              message:`Announcement: '${newAnn.title}' by ${newAnn.createdBy}`,
              entityType:'ANNOUNCEMENT',
              entityId:newAnn.id,
              channel:'INTERNAL',
              isRead:false,
              createdAt:new Date().toISOString()
            });
          }
        })
      }
    },
    onError:(err)=>{
      console.error('Failed to create announcement',err);
      toast.error('Failed to create announcement: ' + (err.message || err));
    }
    
  });

  const deleteAnnouncement=useMutation({
    mutationFn:(id)=> announcementService.delete(id),
    onSuccess:()=>{
      queryclient.invalidateQueries({queryKey:ANNOUNCEMENTS_KEY})
    },
    onError:(err)=>{
      console.error("Failed to delete announcement",err);
      toast.error('Failed to delete announcement: ' + (err.message || err));
    }
  })
  
  return {
    announcements,
    isLoading,
    error,
    createAnnouncement,
    deleteAnnouncement,
  }
}
