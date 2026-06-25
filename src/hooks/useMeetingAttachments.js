import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentService } from '../services/attachmentService';
import { useToast } from '../components/ui/Toast';

export const meetingAttachmentsKey = (meetingId) => ['meetings', meetingId, 'attachments'];

export function useMeetingAttachments(meetingId) {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  const isRealId = typeof meetingId === 'number' || (typeof meetingId === 'string' && /^\d+$/.test(meetingId));

  const { data: attachments = [], isLoading, error } = useQuery({
    queryKey: meetingAttachmentsKey(meetingId),
    queryFn: () => isRealId ? attachmentService.getByMeetingId(meetingId) : Promise.resolve([]),
    enabled: !!meetingId && isRealId,
  });

  const uploadAttachment = useMutation({
    mutationFn: (file) => {
      if (!isRealId) {
        throw new Error('Attachments are only supported for scheduled database meetings, not mock meetings.');
      }
      return attachmentService.upload(meetingId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingAttachmentsKey(meetingId) });
    },
    onError: (err) => {
      console.error('Upload failed:', err);
      toast.error('Upload failed: ' + (err.message || err));
    }
  });

 
  const deleteAttachment = useMutation({
    mutationFn: (id) => attachmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingAttachmentsKey(meetingId) });
    },
    onError: (err) => {
      console.error('Delete failed:', err);
      toast.error('Delete failed: ' + (err.message || err));
    }
  });

  return {
    attachments,
    isLoading: isRealId ? isLoading : false,
    error,
    uploadAttachment, 
    deleteAttachment, 
    isRealId
  };
}