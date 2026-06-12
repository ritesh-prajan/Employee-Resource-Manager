import React from 'react';
import { TODAY } from '../../utils/dateHelpers';

export default function ProjectProgressPanel({ teamProjects, tasks }) {
  if (!teamProjects.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
      No projects linked to this team
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', height: '100%', paddingRight: 4 }}>
      {teamProjects.map(proj => {
        const projTasks = tasks.filter(t => t.projectId === proj.id);
        const done = projTasks.filter(t => t.status?.toUpperCase() === 'COMPLETED').length;
        const total = projTasks.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : (proj.progress || 0);
        const overdue = projTasks.filter(t => {
          const s = t.status?.toUpperCase();
          return s !== 'COMPLETED' && s !== 'REJECTED' && t.etaDate && new Date(t.etaDate) < new Date(TODAY);
        }).length;

        return (
          <div key={proj.id} style={{ padding: '0.75rem', background: 'var(--secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color || '#3b82f6', flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--foreground)' }}>{proj.name}</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--foreground)' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 3, background: proj.color || '#3b82f6', width: `${pct}%`, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>
              <span>{done}/{total} tasks done</span>
              {overdue > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠ {overdue} overdue</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}