import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

const TODAY = new Date().toISOString().split('T')[0];

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
}

export default function useTeamAttendance() {
  const { currentUser, users, teams, attendanceHistory } = useApp();

  // Find the team this lead owns/co-leads
  const myTeam = useMemo(
    () => teams.find(t =>
      String(t.leadId) === String(currentUser?.id) ||
      String(t.subLeadId) === String(currentUser?.id)
    ),
    [teams, currentUser]
  );

  const memberIds = myTeam?.members || [];
  const teamMembers = useMemo(
    () => users.filter(u => memberIds.some(mid => String(mid) === String(u.id))),
    [users, memberIds]
  );

  // Today's attendance map: employeeId → record
  const todayAttMap = useMemo(() => {
    const map = {};
    attendanceHistory.filter(a => a.date === TODAY).forEach(a => { map[a.employeeId] = a; });
    return map;
  }, [attendanceHistory]);

  // Enriched rows for the table
  const rows = useMemo(() => {
    const last30 = getLast30Days();
    const workdays30 = last30.filter(d => {
      const day = new Date(d + 'T00:00:00').getDay();
      return day !== 0 && day !== 6 && d <= TODAY;
    }).length;

    return teamMembers.map(member => {
      const todayAtt    = todayAttMap[member.id];
      const status      = todayAtt?.status      || 'Absent';
      const clockIn     = todayAtt?.clockIn     || null;
      const clockOut    = todayAtt?.clockOut    || null;
      const hours       = todayAtt ? parseFloat(todayAtt.totalWorkHours || 0).toFixed(1) + 'h' : '—';
      const clockStatus = todayAtt?.clockStatus || 'Offline';

      const presentDays = attendanceHistory.filter(
        a => String(a.employeeId) === String(member.id) && last30.includes(a.date) && (a.status === 'Present' || a.status === 'WFH')
      ).length;

      const attendancePct = workdays30 > 0 ? Math.round((presentDays / workdays30) * 100) : 0;

      return { ...member, status, clockIn, clockOut, hours, clockStatus, attendancePct };
    });
  }, [teamMembers, todayAttMap, attendanceHistory]);

  // Summary counts
  const summary = useMemo(() => ({
    Present: rows.filter(r => r.status === 'Present').length,
    WFH:     rows.filter(r => r.status === 'WFH').length,
    Leave:   rows.filter(r => r.status === 'Leave').length,
    Absent:  rows.filter(r => r.status === 'Absent').length,
  }), [rows]);

  return { myTeam, rows, summary, attendanceHistory };
}