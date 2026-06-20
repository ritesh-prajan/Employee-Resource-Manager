import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const WEEK_DAYS = [
  { label: 'Mon', date: '2026-05-25' },
  { label: 'Tue', date: '2026-05-26' },
  { label: 'Wed', date: '2026-05-27' },
  { label: 'Thu', date: '2026-05-28' },
  { label: 'Fri', date: '2026-05-29' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '0.6rem 0.85rem', boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
        {payload[0].value.toFixed(1)}h
      </p>
      <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>Click to view entries</p>
    </div>
  );
};

function Modal({ day, entries, onClose }) {
  const total = entries.reduce((s, e) => s + parseFloat(e.duration), 0);
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
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>{day.label} — Time Entries</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>{day.date} · {total.toFixed(1)}h total</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)', fontSize: '1.25rem', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        {/* Entries */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {entries.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>No entries for this day.</p>
          ) : entries.map((e, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.6rem 0.75rem', borderRadius: '8px',
              backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.description || e.taskName || 'General work'}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {e.workCategory && (
                    <span style={{
                      fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px',
                      backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', fontWeight: 500,
                    }}>{e.workCategory}</span>
                  )}
                  {e.projectName && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>{e.projectName}</span>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: 'var(--foreground)', flexShrink: 0, marginLeft: '0.75rem',
              }}>{parseFloat(e.duration).toFixed(1)}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WeeklyHoursChart({ timeEntries }) {
  const [selected, setSelected] = useState(null);
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

  const data = WEEK_DAYS.map(({ label, date }) => ({
    day: label,
    date,
    hours: timeEntries
      .filter(e => e.date === date)
      .reduce((sum, e) => sum + parseFloat(e.duration), 0),
  }));

  const maxHours = Math.max(...data.map(d => d.hours), 1);

  const handleClick = (payload) => {
    if (!payload?.activePayload?.length) return;
    const dayData = data.find(d => d.day === payload.activePayload[0].payload.day);
    if (!dayData) return;
    const entries = timeEntries.filter(e => e.date === dayData.date);
    setSelected({ day: { label: dayData.day, date: dayData.date }, entries });
  };

  return (
    <>
      <div style={{
        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1.25rem', display: 'flex',
        flexDirection: 'column', gap: '0.75rem', height: '100%',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Weekly Hours</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Team output Mon – Fri · click day to drill down</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--foreground)' }}>
            {data.reduce((s, d) => s + d.hours, 0).toFixed(1)}h total
          </span>
        </div>

        <div ref={containerRef} style={{ flex: 1, minHeight: 0, cursor: 'pointer' }}>
          {dimensions.width > 0 && dimensions.height > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} onClick={handleClick}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, Math.ceil(maxHours * 1.2)]}
                  tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}h`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                <Area
                  type="monotone" dataKey="hours"
                  stroke="var(--chart-1)" strokeWidth={2}
                  fill="url(#hoursGradient)"
                  dot={{ fill: 'var(--chart-1)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: 'var(--chart-1)', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {selected && <Modal {...selected} onClose={() => setSelected(null)} />}
    </>
  );
}