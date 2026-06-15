// pages/employee/Attendance.jsx
import React from 'react';
import useTeamAttendance from '../../hooks/useTeamAttendance';
import AttendanceSummaryCards from '../../components/teamlead/attendance/AttendanceSummaryCards';
import AttendanceToolbar from '../../components/teamlead/attendance/AttendanceToolbar';
import TeamAttendanceTable from '../../components/teamlead/attendance/TeamAttendanceTable';
import AttendanceDetailModal from '../../components/teamlead/attendance/AttendanceDetailModal';

export default function Attendance() {
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--canvas)' }}>

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