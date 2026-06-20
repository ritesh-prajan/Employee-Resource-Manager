import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getLast7Days, fmtDay } from '../../utils/dateHelpers';

export default function WeeklyTeamHoursChart({ timeEntries, memberIds }) {
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

  const days = getLast7Days();
  const data = days.map(day => {
    const total = timeEntries
      .filter(e => e.date === day && memberIds.includes(e.userId))
      .reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
    return { day: fmtDay(day), hours: parseFloat(total.toFixed(1)) };
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem' }} formatter={v => [`${v}h`, 'Team Hours']} />
            <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}