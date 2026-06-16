import React, { useState, useMemo } from 'react';
import { Fingerprint } from 'lucide-react';
import useTeamAttendance from '../../hooks/useTeamAttendance';
import AttendanceSummaryCards from '../../components/teamlead/attendance/AttendanceSummaryCards';
import AttendanceToolbar from '../../components/teamlead/attendance/AttendanceToolbar';
import TeamAttendanceTable from '../../components/teamlead/attendance/TeamAttendanceTable';
import AttendanceDetailModal from '../../components/teamlead/attendance/AttendanceDetailModal';

export default function TeamAttendance() {
  const { myTeam, rows, summary, attendanceHistory } = useTeamAttendance();

  const [searchQuery, setSearchQuery]     = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Toggle filter when clicking a KPI card
  const handleFilterToggle = (key) => setFilterStatus(f => f === key ? '' : key);

  // Apply search + status filter
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (filterStatus && r.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.designation || r.department || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, filterStatus, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 34, height: 34, borderRadius: '9px', background: 'color-mix(in oklch, var(--primary) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Fingerprint size={17} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
            Team Attendance
          </h2>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
            Monitor daily check-ins, remote hours, and active work statuses of your team
          </p>
        </div>
      </div>

      <AttendanceSummaryCards
        summary={summary}
        filterStatus={filterStatus}
        onFilter={handleFilterToggle}
      />

      <AttendanceToolbar
        searchQuery={searchQuery}
        onSearchChange={e => setSearchQuery(e.target.value)}
        filterStatus={filterStatus}
        onStatusChange={e => setFilterStatus(e.target.value)}
        team={myTeam}
      />

      <TeamAttendanceTable
        rows={filteredRows}
        onViewMember={setSelectedMember}
      />

      <AttendanceDetailModal
        member={selectedMember}
        attendanceHistory={attendanceHistory}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}