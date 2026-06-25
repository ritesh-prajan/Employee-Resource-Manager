// components/teamlead/attendance/TeamAttendanceTable.jsx
import React, { useMemo } from 'react';
import DataTable from '../../ui/DataTable';
import UserAvatar from '../../ui/UserAvatar';
import AttendanceStatusPill from './AttendanceStatusPill';

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function AttendanceBar({ pct }) {
  const color = pct >= 90 ? '#22c55e' : pct >= 75 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 56, height: 6, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{pct}%</span>
    </div>
  );
}

function LiveDot({ clockStatus }) {
  const color = clockStatus === 'Clocked In' ? '#22c55e' : clockStatus === 'On Break' ? '#f59e0b' : 'var(--muted-foreground)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{clockStatus}</span>
    </div>
  );
}

/**
 * Props:
 *   rows          — enriched member rows from useTeamAttendance
 *   onViewMember  — (member) => void — opens detail modal
 */
export default function TeamAttendanceTable({ rows, onViewMember }) {
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Staff Member',
      cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <UserAvatar name={row.original.name} />
          <span
            style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.textDecoration = 'none'; }}
            onClick={() => onViewMember(row.original)}
          >
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => (
        <span style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
          {row.original.designation || row.original.department || 'General'}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: "Today's Status",
      cell: ({ getValue }) => <AttendanceStatusPill status={getValue()} />,
    },
    {
      accessorKey: 'clockIn',
      header: 'Clock In',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--foreground)' }}>
          {fmtTime(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'clockOut',
      header: 'Clock Out',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--foreground)' }}>
          {fmtTime(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'hours',
      header: 'Hrs Today',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'timesheetHoursToday',
      header: 'Timesheet Hrs',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
          {getValue().toFixed(1)}h
        </span>
      ),
    },
    {
      accessorKey: 'uniqueLoggedDays',
      header: 'Logged Days',
      cell: ({ getValue }) => (
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
          {getValue()} days
        </span>
      ),
    },
    {
      accessorKey: 'attendancePct',
      header: '30-Day Rate',
      cell: ({ getValue }) => <AttendanceBar pct={getValue()} />,
    },
    {
      accessorKey: 'clockStatus',
      header: 'Live Status',
      cell: ({ getValue }) => <LiveDot clockStatus={getValue()} />,
    },
    {
      id: 'actions',
      header: 'Details',
      cell: ({ row }) => (
        <button
          onClick={() => onViewMember(row.original)}
          style={{
            background: 'color-mix(in oklch, var(--primary) 8%, transparent)',
            border: 'none', color: 'var(--primary)', cursor: 'pointer',
            padding: '5px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 16%, transparent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--primary) 8%, transparent)'}
        >
          View History
        </button>
      ),
    },
  ], [onViewMember]);

  return <DataTable Data={rows} columns={columns} onRowClick={onViewMember} />;
}