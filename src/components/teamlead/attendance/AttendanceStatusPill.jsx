// components/teamlead/attendance/AttendanceStatusPill.jsx
import React from 'react';

export const ATTENDANCE_STATUS_CONFIG = {
  Present: { color: '#22c55e', bg: '#22c55e1a', label: 'Present' },
  WFH:     { color: '#3b82f6', bg: '#3b82f61a', label: 'WFH'     },
  Leave:   { color: '#ef4444', bg: '#ef44441a', label: 'Leave'   },
  Absent:  { color: '#f59e0b', bg: '#f59e0b1a', label: 'Absent'  },
};

export default function AttendanceStatusPill({ status }) {
  const cfg = ATTENDANCE_STATUS_CONFIG[status] || ATTENDANCE_STATUS_CONFIG.Absent;
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 6,
      backgroundColor: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}