/**
 * @file useTimer.js
 * @description Domain hook for tracking clocked hours, break sessions, and active work durations.
 */

import { useState, useCallback } from 'react';

export function useTimer({ onClockIn, onToggleBreak, onClockOut } = {}) {
  const [timerState, setTimerState] = useState({
    isClockedIn: false,
    startTime: null,
    taskId: '',
    projectId: '',
    description: '',
    workCategory: 'Story',
    isOnBreak: false,
    breakStartTime: null,
    totalBreakSeconds: 0
  });

  const clockIn = useCallback((taskId, projectId, description, workCategory = 'Story') => {
    const now = new Date().toISOString();
    setTimerState({
      isClockedIn: true,
      startTime: now,
      taskId,
      projectId,
      description: description || "Working on task",
      workCategory,
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 0
    });

    if (onClockIn) {
      onClockIn(taskId, projectId, description, workCategory, now);
    }
  }, [onClockIn]);

  const toggleBreak = useCallback(() => {
    setTimerState(prev => {
      if (!prev.isClockedIn) return prev;

      const now = new Date().toISOString();

      if (!prev.isOnBreak) {
        if (onToggleBreak) {
          onToggleBreak(true, now);
        }
        return {
          ...prev,
          isOnBreak: true,
          breakStartTime: now
        };
      } else {
        const breakEnd = new Date();
        const breakStart = new Date(prev.breakStartTime);
        const diffSeconds = Math.floor((breakEnd - breakStart) / 1000);
        const diffMinutes = Math.ceil(diffSeconds / 60);

        if (onToggleBreak) {
          onToggleBreak(false, now, diffMinutes, breakEnd, breakStart);
        }

        return {
          ...prev,
          isOnBreak: false,
          breakStartTime: null,
          totalBreakSeconds: prev.totalBreakSeconds + diffSeconds
        };
      }
    });
  }, [onToggleBreak]);

  const clockOut = useCallback((justification = '') => {
    if (!timerState.isClockedIn) return;

    const startTime = new Date(timerState.startTime);
    const diffMs = new Date() - startTime;
    const breakMs = timerState.totalBreakSeconds * 1000;
    const netMs = Math.max(0, diffMs - breakMs);
    
    let durationHours = (netMs / (1000 * 60 * 60));
    if (durationHours < 0.05) {
      durationHours = 0.5; // demo minimum
    }
    durationHours = parseFloat(durationHours.toFixed(2));

    const displayEndTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

    if (onClockOut) {
      onClockOut(timerState, durationHours, displayEndTime, justification);
    }

    setTimerState({
      isClockedIn: false,
      startTime: null,
      taskId: '',
      projectId: '',
      description: '',
      workCategory: 'Story',
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 0
    });
  }, [timerState, onClockOut]);

  const cancelTimer = useCallback(() => {
    setTimerState({
      isClockedIn: false,
      startTime: null,
      taskId: '',
      projectId: '',
      description: '',
      workCategory: 'Story',
      isOnBreak: false,
      breakStartTime: null,
      totalBreakSeconds: 0
    });
  }, []);

  return {
    timerState,
    clockIn,
    toggleBreak,
    clockOut,
    cancelTimer
  };
}