import React, { useState } from 'react';

const STATUS_ORDER = ['Open', 'In Progress', 'Pending Review', 'Completed', 'Backlog'];
const STATUS_COLORS = {
  'Open': 'var(--muted-foreground)',
  'In Progress': 'var(--chart-1)',
  'Pending Review': '#f59e0b',
  'Completed': '#22c55e',
  'Backlog': '#a855f7',
};

function Modal({ proj, tasks, onClose }) {
  const [activeStatus, setActiveStatus] = useState('All');
  const projTasks = tasks.filter(t => t.projectId === proj.id);

  const statusCounts = {};
  STATUS_ORDER.forEach(s => {
    statusCounts[s] = projTasks.filter(t =>
      s === 'Backlog' ? (!t.assignedTo || t.assignedTo === '') : t.status === s
    ).length;
  });

  const filtered = activeStatus === 'All'
    ? projTasks
    : activeStatus === 'Backlog'
      ? projTasks.filter(t => !t.assignedTo || t.assignedTo === '')
      : projTasks.filter(t => t.status === activeStatus);

  const tabs = ['All', ...STATUS_ORDER.filter(s => statusCounts[s] > 0)];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '850px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: proj.color, flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>{proj.name.split(' (')[0]}</h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{projTasks.length} tasks total</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)', fontSize: '1.25rem', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {tabs.map(tab => {
            const isActive = activeStatus === tab;
            const color = tab === 'All' ? 'var(--foreground)' : STATUS_COLORS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveStatus(tab)}
                style={{
                  fontSize: '0.68rem', fontWeight: 600, padding: '3px 10px',
                  borderRadius: '6px', cursor: 'pointer', border: '1px solid',
                  borderColor: isActive ? color : 'var(--border)',
                  backgroundColor: isActive ? `${color}18` : 'transparent',
                  color: isActive ? color : 'var(--muted-foreground)',
                  transition: 'all 0.15s',
                }}
              >
                {tab} {tab !== 'All' && `(${statusCounts[tab]})`}
              </button>
            );
          })}
        </div>

        {/* Task list */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>No tasks.</p>
          ) : filtered.map((t, i) => {
            const statusColor = STATUS_COLORS[t.status] || 'var(--muted-foreground)';
            const isBacklog = !t.assignedTo || t.assignedTo === '';
            return (
              <div key={i} style={{
                padding: '0.65rem 0.75rem', borderRadius: '8px',
                backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column', gap: '0.3rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{t.name}</span>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    {isBacklog && (
                      <span style={{
                        fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px',
                        backgroundColor: '#a855f718', color: '#a855f7',
                        border: '1px solid #a855f730', fontWeight: 600,
                      }}>Backlog</span>
                    )}
                    <span style={{
                      fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: `${statusColor}18`, color: statusColor,
                      border: `1px solid ${statusColor}30`, fontWeight: 600,
                    }}>{t.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {t.priority && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
                      Priority: <strong>{t.priority}</strong>
                    </span>
                  )}
                  {t.etaDate && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
                      ETA: <strong>{t.etaDate}</strong>
                    </span>
                  )}
                  {t.eta && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                      {t.eta}h budgeted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProjectTaskHealth({ tasks, projects }) {
  const [selectedProj, setSelectedProj] = useState(null);
  const activeProjects = projects.filter(p => p.status === 'Active');

  const projectData = activeProjects.map(proj => {
    const projTasks = tasks.filter(t => t.projectId === proj.id);
    const total = projTasks.length || 1;

    const counts = {
      'Open': projTasks.filter(t => t.status === 'Open').length,
      'In Progress': projTasks.filter(t => t.status === 'In Progress').length,
      'Pending Review': projTasks.filter(t => t.status === 'Pending Review').length,
      'Completed': projTasks.filter(t => t.status === 'Completed').length,
      'Backlog': projTasks.filter(t => !t.assignedTo || t.assignedTo === '').length,
    };

    const completedPct = Math.round((counts['Completed'] / total) * 100);
    const totalEta = projTasks.reduce((s, t) => s + (t.eta || 0), 0);
    const totalLogged = projTasks.reduce((s, t) => s + (t.logged || 0), 0);

    return { proj, counts, total: projTasks.length, completedPct, totalEta, totalLogged };
  });

  return (
    <>
      <div style={{
        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.25rem', display: 'flex',
        flexDirection: 'column', gap: '0.75rem', height: '100%',
        overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Project Task Health</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Tasks & hours per project · click to drill down</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {STATUS_ORDER.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '2px', backgroundColor: STATUS_COLORS[s], flexShrink: 0 }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Project rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, overflowY: 'auto' }}>
          {projectData.map(({ proj, counts, total, completedPct, totalEta, totalLogged }) => {
            const isOverBudget = totalLogged > totalEta;
            const realTotal = Object.values(counts).reduce((s, v) => s + v, 0) || 1;

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProj(proj)}
                style={{
                  borderRadius: '9px', backgroundColor: 'var(--secondary)',
                  border: '1px solid var(--border)', padding: '0.6rem 0.75rem',
                  display: 'flex', flexDirection: 'column', gap: '0.45rem',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: proj.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)' }}>
                      {proj.name.split(' (')[0]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                      color: isOverBudget ? '#ef4444' : 'var(--muted-foreground)',
                    }}>
                      {totalLogged.toFixed(0)}h / {totalEta}h
                    </span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
                      borderRadius: '4px', backgroundColor: '#22c55e18', color: '#22c55e',
                    }}>
                      {completedPct}% done
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', backgroundColor: 'var(--muted)' }}>
                  {STATUS_ORDER.map(s => {
                    const pct = (counts[s] / realTotal) * 100;
                    return pct > 0 ? (
                      <div key={s} style={{
                        width: `${pct}%`, height: '100%',
                        backgroundColor: STATUS_COLORS[s],
                        transition: 'width 0.4s ease',
                      }} />
                    ) : null;
                  })}
                </div>

                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {STATUS_ORDER.map(s => counts[s] > 0 && (
                    <span key={s} style={{
                      fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: `${STATUS_COLORS[s]}18`,
                      color: STATUS_COLORS[s], fontWeight: 600,
                      border: `1px solid ${STATUS_COLORS[s]}30`,
                    }}>
                      {counts[s]} {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedProj && (
        <Modal proj={selectedProj} tasks={tasks} onClose={() => setSelectedProj(null)} />
      )}
    </>
  );
}