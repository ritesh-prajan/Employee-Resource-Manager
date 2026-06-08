import React, { useState } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

const TODAY = '2026-05-29';
const WEEK_START = new Date('2026-05-25');
const WEEK_END = new Date('2026-05-31');

export default function HourRankings({ users, tasks, projects, timeEntries }) {
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedUser, setExpandedUser] = useState(null);
  const [period, setPeriod] = useState('week');

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const filterByPeriod = (entries) => entries.filter(e => {
    if (period === 'all') return true;
    if (period === 'day') return e.date === TODAY;
    if (period === 'week') {
      const d = new Date(e.date);
      return d >= WEEK_START && d <= WEEK_END;
    }
    if (period === 'month') return e.date.startsWith('2026-05');
    return true;
  });

  const rankings = users.map(user => {
    const entries = filterByPeriod(timeEntries.filter(e => e.userId === user.id));
    const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.duration), 0);

    const projectBreakdown = projects.map(proj => ({
      ...proj,
      hours: entries.filter(e => e.projectId === proj.id).reduce((s, e) => s + parseFloat(e.duration), 0),
    })).filter(p => p.hours > 0);

    const taskBreakdown = tasks
      .filter(t => t.assignedTo === user.id)
      .map(t => ({
        ...t,
        hours: entries.filter(e => e.taskId === t.id).reduce((s, e) => s + parseFloat(e.duration), 0),
      }))
      .filter(t => t.hours > 0);

    return { user, totalHours, projectBreakdown, taskBreakdown };
  });

  const sorted = [...rankings].sort((a, b) =>
    sortOrder === 'desc' ? b.totalHours - a.totalHours : a.totalHours - b.totalHours
  );

  const maxHours = Math.max(...rankings.map(r => r.totalHours)) || 1;

  return (
    <div style={{
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      height: '100%',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Hour Rankings</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>By project & task</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Period toggle */}
          <div style={{
            display: 'inline-flex', backgroundColor: 'var(--secondary)',
            padding: '2px', borderRadius: '7px', border: '1px solid var(--border)',
          }}>
            {['day', 'week', 'month', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '0.2rem 0.55rem', fontSize: '0.65rem', fontWeight: 650,
                borderRadius: '5px', border: 'none', cursor: 'pointer',
                backgroundColor: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                textTransform: 'capitalize', transition: 'all 0.15s',
              }}>
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowUpDown size={11} />
            {sortOrder === 'desc' ? 'Most' : 'Least'}
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
        {sorted.map((rank, i) => {
          const isExpanded = expandedUser === rank.user.id;
          const widthPct = Math.min(100, Math.max(4, Math.round((rank.totalHours / maxHours) * 100)));

          return (
            <div key={rank.user.id} style={{
              borderRadius: '9px',
              backgroundColor: 'var(--secondary)',
              border: '1px solid var(--border)',
              padding: '0.5rem 0.65rem',
            }}>
              {/* Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', minWidth: '16px' }}>
                  #{i + 1}
                </span>
                <div className="user-initials-badge" style={{ width: '26px', height: '26px', fontSize: '0.65rem', flexShrink: 0 }}>
                  {getInitials(rank.user.name)}
                </div>
                <div style={{ minWidth: '110px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>{rank.user.name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)' }}>{rank.user.role}</div>
                </div>

                {/* Bar */}
                <div style={{ flex: 1, minWidth: '80px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ height: '5px', flex: 1, backgroundColor: 'var(--muted)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${widthPct}%`,
                      background: 'linear-gradient(90deg, var(--chart-1), var(--chart-2))',
                      borderRadius: '3px', transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--foreground)', minWidth: '38px', textAlign: 'right' }}>
                    {rank.totalHours.toFixed(1)}h
                  </span>
                </div>

                {/* Project pills */}
                <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', maxWidth: '140px' }}>
                  {rank.projectBreakdown.slice(0, 2).map(p => (
                    <span key={p.id} style={{
                      fontSize: '0.58rem', padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: `${p.color}18`, color: p.color,
                      border: `1px solid ${p.color}30`, fontWeight: 600,
                    }}>
                      {p.name.split(' (')[0].substring(0, 8)}: {p.hours.toFixed(1)}h
                    </span>
                  ))}
                  {rank.projectBreakdown.length === 0 && (
                    <span style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No logs</span>
                  )}
                </div>

                <button
                  onClick={() => setExpandedUser(isExpanded ? null : rank.user.id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem', width: '22px', height: '22px', flexShrink: 0 }}
                >
                  {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              </div>

              {/* Expanded task breakdown */}
              {isExpanded && (
                <div style={{
                  marginTop: '0.5rem', paddingTop: '0.5rem',
                  borderTop: '1px dashed var(--border)',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem',
                }}>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
                    Task Breakdown
                  </span>
                  {rank.taskBreakdown.length === 0 ? (
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No task hours logged.</p>
                  ) : rank.taskBreakdown.map(t => {
                    const proj = projects.find(p => p.id === t.projectId);
                    return (
                      <div key={t.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontSize: '0.72rem', padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--background)', borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                          {proj && (
                            <span style={{ fontSize: '0.58rem', padding: '1px 4px', borderRadius: '3px', backgroundColor: `${proj.color}18`, color: proj.color, flexShrink: 0 }}>
                              {proj.name.split(' (')[0]}
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, flexShrink: 0 }}>
                          {t.hours.toFixed(1)}h / {t.eta}h
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}