import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  OPEN: '#6b7280', IN_PROGRESS: '#3b82f6', PENDING_REVIEW: '#f59e0b',
  COMPLETED: '#10b981', OVER_ETA: '#ef4444', ETA_EXTENDED: '#f97316',
  REJECTED: '#dc2626', TRANSFERRED: '#8b5cf6',
};

export default function TaskStatusDonut({ tasks }) {
  const counts = {};
  tasks.forEach(t => {
    const s = t.status?.toUpperCase().replace(' ', '_') || 'OPEN';
    counts[s] = (counts[s] || 0) + 1;
  });
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>
      No tasks found
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '1rem', height: '100%', alignItems: 'center' }}>
      <ResponsiveContainer width="55%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="52%" outerRadius="80%" paddingAngle={2} startAngle={90} endAngle={-270}>
            {data.map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem' }}
            formatter={(value, name) => [value, name.replace(/_/g, ' ')]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.7rem', overflow: 'auto', flex: 1 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[d.name] || '#94a3b8', flexShrink: 0 }} />
            <span style={{ color: 'var(--muted-foreground)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.name.replace(/_/g, ' ')}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--foreground)', marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}