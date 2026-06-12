import React from 'react';
import { getLast7Days, TODAY } from '../../utils/dateHelpers';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
}

export default function MemberPerformanceTable({ members, tasks, users, timeEntries }) {
  const rows = members.map(memberId => {
    const user = users.find(u => u.id === memberId);
    const memberTasks = tasks.filter(t => t.assignedTo === memberId);
    const completed = memberTasks.filter(t => t.status?.toUpperCase() === 'COMPLETED').length;
    const total = memberTasks.length;
    const overdue = memberTasks.filter(t => {
      const s = t.status?.toUpperCase();
      return s !== 'COMPLETED' && s !== 'REJECTED' && t.etaDate && new Date(t.etaDate) < new Date(TODAY);
    }).length;
    const hoursThisWeek = timeEntries
      .filter(e => e.userId === memberId && e.date >= getLast7Days()[0])
      .reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { memberId, user, total, completed, overdue, hoursThisWeek: parseFloat(hoursThisWeek.toFixed(1)), completionRate };
  });

  return (
    <div style={{ overflowX: 'auto', height: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Member', 'Tasks', 'Completed', 'Overdue', 'Hours (Week)', 'Completion'].map(h => (
              <th key={h} style={{ padding: '6px 10px', textAlign: h === 'Member' ? 'left' : 'center', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>No team members found</td></tr>
          ) : rows.map(row => (
            <tr key={row.memberId} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(row.user?.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>{row.user?.name || `Employee #${row.memberId}`}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{row.user?.designation || 'Employee'}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--foreground)', fontWeight: 500 }}>{row.total}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{row.completed}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                {row.overdue > 0 ? <span style={{ color: '#ef4444', fontWeight: 700 }}>{row.overdue}</span> : <span style={{ color: '#10b981' }}>—</span>}
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: '#8b5cf6', fontWeight: 600 }}>{row.hoursThisWeek}h</td>
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, maxWidth: 60, minWidth: 40 }}>
                    <div style={{ height: '100%', borderRadius: 3, background: row.completionRate >= 70 ? '#10b981' : row.completionRate >= 40 ? '#f59e0b' : '#ef4444', width: `${row.completionRate}%` }} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.72rem', minWidth: 28 }}>{row.completionRate}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}