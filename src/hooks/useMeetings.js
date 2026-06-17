/**
 * @file useMeetings.js
 * @description Domain hook for scheduled sync sessions, using TanStack Query for remote actions with local state fallback.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService } from '../services/meetingService';

export const MEETINGS_KEY = ['meetings'];

export function useMeetings({ currentUser, onAddNotification, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const [localMeetings, setLocalMeetings] = useState([]);

  const query = useQuery({
    queryKey: MEETINGS_KEY,
    queryFn: async () => {
      try {
        return await meetingService.getAll();
      } catch (err) {
        console.error("meetingService.getAll failed, utilizing mock database fallback:", err);
        return null;
      }
    },
    enabled
  });

  const meetings = useMemo(() => {
    if (query.data && query.data.length > 0) return query.data;
    return localMeetings;
  }, [query.data, localMeetings]);

  const createMeetingMutation = useMutation({
    mutationFn: (meetData) => meetingService.create(meetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEETINGS_KEY });
    },
    onError: (err) => console.error("Failed to create meeting on backend:", err)
  });

  const createMeeting = useCallback((meetData) => {
    const newMeet = {
      id: `meeting-${Date.now()}`,
      title: meetData.title,
      description: meetData.description,
      meetingDate: meetData.meetingDate,
      durationMinutes: parseInt(meetData.durationMinutes, 10) || 45,
      meetingLink: meetData.meetingLink || "https://teams.microsoft.com/l/meetup-join/mock-created-link",
      created_by: currentUser?.id,
      team_id: meetData.team_id || "team-eng",
      notifyVia: meetData.notifyVia || "TEAMS",
      status: "Scheduled",
      participants: meetData.participants || [],
      taskReference: meetData.taskReference || null,
      projectId: meetData.projectId || null
    };

    setLocalMeetings(prev => [...prev, newMeet]);
    createMeetingMutation.mutate(newMeet);

    // Send notifications to participants
    if (onAddNotification && meetData.participants) {
      meetData.participants.forEach(pId => {
        onAddNotification({
          id: `notif-${Date.now()}-${pId}`,
          recipientId: pId,
          type: "MEETING_REMINDER",
          title: "New Meeting Scheduled",
          message: `You are invited to '${newMeet.title}' on ${new Date(newMeet.meetingDate).toLocaleString()}`,
          entityType: "MEETING",
          entityId: newMeet.id,
          channel: newMeet.notifyVia,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      });
    }
  }, [currentUser, onAddNotification, createMeetingMutation]);

  return {
    meetings,
    createMeeting
  };
}
