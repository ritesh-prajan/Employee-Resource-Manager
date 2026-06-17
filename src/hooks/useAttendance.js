/**
 * @file useAttendance.js
 * @description Domain hook for tracking clock status, break records, and general check-in history.
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendanceService';

export const ATTENDANCE_KEY = ['attendanceHistory'];

export function useAttendance({ currentUser, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const [localAttendance, setLocalAttendance] = useState([]);

  const query = useQuery({
    queryKey: ATTENDANCE_KEY,
    queryFn: async () => {
      try {
        return await attendanceService.getAll();
      } catch (err) {
        console.error("attendanceService.getAll failed, utilizing mock database fallback:", err);
        return null;
      }
    },
    enabled
  });

  const attendanceHistory = useMemo(() => {
    if (query.data && query.data.length > 0) return query.data;
    return localAttendance;
  }, [query.data, localAttendance]);

  const clockInAttendance = useCallback((employeeId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    setLocalAttendance(prev => {
      const alreadyExists = prev.some(a => String(a.employeeId) === String(employeeId) && a.date === todayStr);
      if (alreadyExists) {
        return prev.map(a => {
          if (String(a.employeeId) === String(employeeId) && a.date === todayStr) {
            return { ...a, clockStatus: "Clocked In", lastStatusUpdate: new Date().toISOString() };
          }
          return a;
        });
      } else {
        return [{
          id: `att-${Date.now()}`,
          employeeId,
          date: todayStr,
          clockIn: new Date().toISOString(),
          clockOut: null,
          totalWorkHours: "0.00",
          totalBreakHours: "0.00",
          status: "Present",
          clockStatus: "Clocked In",
          breaks: []
        }, ...prev];
      }
    });

    attendanceService.clockIn(employeeId).catch(err => {
      console.error("Failed to clock in on backend attendanceService:", err);
    });
  }, []);

  const toggleBreakAttendance = useCallback((employeeId, isBreakStart, now, diffMinutes, breakEnd, breakStart) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setLocalAttendance(prev => 
      prev.map(a => {
        if (String(a.employeeId) === String(employeeId) && a.date === todayStr) {
          if (isBreakStart) {
            const newBreaks = [...(a.breaks || []), { start: new Date().toTimeString().slice(0, 5), end: null, duration: 0, type: "Regular" }];
            return { ...a, clockStatus: "On Break", breaks: newBreaks, lastStatusUpdate: now };
          } else {
            const newBreaks = (a.breaks || []).map(b => b.end === null ? { ...b, end: breakEnd.toTimeString().slice(0, 5), duration: diffMinutes } : b);
            const totalBreakHr = parseFloat((a.totalBreakHours || 0)) + (diffMinutes / 60);
            return { 
              ...a, 
              clockStatus: "Clocked In", 
              breaks: newBreaks, 
              totalBreakHours: totalBreakHr.toFixed(2),
              lastStatusUpdate: now 
            };
          }
        }
        return a;
      })
    );
  }, []);

  const clockOutAttendance = useCallback((employeeId, displayEndTime) => {
    const todayStr = new Date().toISOString().split('T')[0];

    setLocalAttendance(prev => 
      prev.map(a => {
        if (String(a.employeeId) === String(employeeId) && a.date === todayStr) {
          const checkIn = new Date(a.clockIn);
          const workHr = parseFloat(((displayEndTime - checkIn) / (1000 * 60 * 60) - (parseFloat(a.totalBreakHours) || 0)).toFixed(2));
          return {
            ...a,
            clockOut: displayEndTime.toISOString(),
            clockStatus: "Offline",
            totalWorkHours: Math.max(0, workHr).toFixed(2),
            lastStatusUpdate: displayEndTime.toISOString()
          };
        }
        return a;
      })
    );

    attendanceService.clockOut(employeeId).catch(err => {
      console.error("Failed to clock out on backend attendanceService:", err);
    });
  }, []);

  const autoClockInOnLogin = useCallback((user) => {
    if (user.role === 'Employee' || user.role === 'Team Lead' || user.role === 'Sub Lead') {
      const todayStr = new Date().toISOString().split('T')[0];
      const alreadyClockedIn = attendanceHistory.some(a => String(a.employeeId) === String(user.id) && a.date === todayStr);
      if (!alreadyClockedIn) {
        const newAtt = {
          id: `att-${Date.now()}`,
          employeeId: user.id,
          date: todayStr,
          clockIn: new Date().toISOString(),
          clockOut: null,
          totalWorkHours: "0.00",
          totalBreakHours: "0.00",
          status: "Present",
          clockStatus: "Offline",
          breaks: []
        };
        setLocalAttendance(prev => [newAtt, ...prev]);
      }
    }
  }, [attendanceHistory]);

  return {
    attendanceHistory,
    clockInAttendance,
    toggleBreakAttendance,
    clockOutAttendance,
    autoClockInOnLogin,
    setAttendanceHistory: setLocalAttendance
  };
}
