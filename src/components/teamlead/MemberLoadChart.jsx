import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TODAY } from '../../utils/dateHelpers';

export default function MemberLoadChart({ members, tasks, users }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const data = members.map(memberId => {
    const user = users.find(u => u.id === memberId);
    const memberTasks = tasks.filter(t => t.assignedTo === memberId);
    return {
      name: user ? user.name.split(' ')[0] : `#${memberId}`,
      Open: memberTasks.filter(t => t.status?.toUpperCase() === 'OPEN').length,
      'In Progress': memberTasks.filter(t => t.status?.toUpperCase() === 'IN_PROGRESS').length,
      Completed: memberTasks.filter(t => t.status?.toUpperCase() === 'COMPLETED').length,
      Overdue: memberTasks.filter(t => {
        const s = t.status?.toUpperCase();
        return s !== 'COMPLETED' && s !== 'CANCELLED' && s !== 'REJECTED' && t.etaDate && new Date(t.etaDate) < new Date(TODAY);
      }).length,
    };
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem' }} cursor={{ fill: 'var(--border)', opacity: 0.5 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.7rem', paddingTop: 8 }} />
            <Bar dataKey="Open" stackId="a" fill="#6b7280" radius={[0,0,0,0]} />
            <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
            <Bar dataKey="Overdue" stackId="a" fill="#ef4444" radius={[0,0,0,0]} />
            <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}