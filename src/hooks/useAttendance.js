/**
 * @file useAttendance.js
 * @description Domain hook for tracking clock status, break records, and general check-in history, using purely local state.
 */

import { useState, useCallback } from 'react';

export function useAttendance() {
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const clockInAttendance = useCallback((employeeId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    setAttendanceHistory(prev => {
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
  }, []);

  const toggleBreakAttendance = useCallback((employeeId, isBreakStart, now, diffMinutes, breakEnd, breakStart) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setAttendanceHistory(prev => 
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

    setAttendanceHistory(prev => 
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
  }, []);

  const autoClockInOnLogin = useCallback((user) => {
    if (user.role === 'Employee' || user.role === 'Team Lead' || user.role === 'Sub Lead') {
      const todayStr = new Date().toISOString().split('T')[0];
      setAttendanceHistory(prev => {
        const alreadyClockedIn = prev.some(a => String(a.employeeId) === String(user.id) && a.date === todayStr);
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
          return [newAtt, ...prev];
        }
        return prev;
      });
    }
  }, []);

  return {
    attendanceHistory,
    clockInAttendance,
    toggleBreakAttendance,
    clockOutAttendance,
    autoClockInOnLogin,
    setAttendanceHistory
  };
}
