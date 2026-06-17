/**
 * @file useMeetings.js
 * @description Domain hook for scheduled sync sessions (Link Room), using purely local state.
 */

import { useState, useCallback } from 'react';

export function useMeetings({ currentUser, onAddNotification } = {}) {
  const [meetings, setMeetings] = useState([]);

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

    setMeetings(prev => [...prev, newMeet]);

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
  }, [currentUser, onAddNotification]);

  return {
    meetings,
    createMeeting
  };
}
