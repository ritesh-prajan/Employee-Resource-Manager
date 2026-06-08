import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function StaffStatusChart({ activeTrackers, totalStaffList, users, tasks, projects }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const breakStaff = activeTrackers.filter(t => t.isOnBreak).length;
  const activeStaff = activeTrackers.filter(t => !t.isOnBreak).length;
  const totalStaff = totalStaffList.length;
  const inactiveStaff = Math.max(0, totalStaff - activeStaff - breakStaff);
  const total = activeStaff + breakStaff + inactiveStaff || 1;

  const pctActive = (activeStaff / total) * 100;
  const pctBreak = (breakStaff / total) * 100;
  const pctInactive = (inactiveStaff / total) * 100;

  const radius = 9.0;
  const circumference = 2 * Math.PI * radius;
  const toStroke = (pct) => (pct / 100) * circumference;

  const activeStaffList = activeTrackers.filter(t => !t.isOnBreak).map(t => ({ ...t, clockStatus: 'Clocked In' }));
  const breakStaffList = activeTrackers.filter(t => t.isOnBreak).map(t => ({ ...t, clockStatus: 'On Break' }));
  const inactiveStaffList = totalStaffList
    .filter(u => !activeTrackers.some(t => t.user.id === u.id))
    .map(u => ({ user: u, clockStatus: 'Offline', startedAt: null, taskName: null, proj: null }));

  const slices = [
    { key: 'Active', color: '#22c55e', pct: pctActive, offset: 0, count: activeStaff, label: 'Online' },
    { key: 'On Break', color: '#f59e0b', pct: pctBreak, offset: toStroke(pctActive), count: breakStaff, label: 'On Break' },
    { key: 'Inactive', color: '#ef4444', pct: pctInactive, offset: toStroke(pctActive + pctBreak), count: inactiveStaff, label: 'Offline' },
  ];

  const getList = () => {
    if (selectedFilter === 'Active') return activeStaffList;
    if (selectedFilter === 'On Break') return breakStaffList;
    return inactiveStaffList;
  };

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>Staff Status</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Live</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flex: 1 }}>
          {/* Donut */}
          <div style={{ width: '140px', height: '140px', flexShrink: 0 }}>
            <svg width="100%" height="100%" viewBox="0 0 42 42" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
              <circle cx="21" cy="21" r="18" fill="var(--muted)" />
              {slices.map(s => s.pct > 0 && (
                <circle
                  key={s.key}
                  cx="21" cy="21" r={radius}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={radius * 2}
                  strokeDasharray={`${toStroke(s.pct)} ${circumference}`}
                  strokeDashoffset={-s.offset}
                  style={{
                    cursor: 'pointer',
                    transition: 'opacity 0.2s, transform 0.2s',
                    opacity: hoveredSlice === s.key ? 0.8 : 1,
                    transform: hoveredSlice === s.key ? 'scale(1.04)' : 'none',
                    transformOrigin: '21px 21px',
                  }}
                  onMouseEnter={() => setHoveredSlice(s.key)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => setSelectedFilter(s.key)}
                />
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            {slices.map(s => (
              <div
                key={s.key}
                onClick={() => setSelectedFilter(s.key)}
                onMouseEnter={() => setHoveredSlice(s.key)}
                onMouseLeave={() => setHoveredSlice(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: hoveredSlice === s.key ? 'var(--accent)' : 'transparent',
                  border: `1px solid ${hoveredSlice === s.key ? 'var(--border)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)', fontFamily: 'var(--font-mono)' }}>
                  {s.pct.toFixed(0)}% ({s.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      {selectedFilter && (
        <div className="modal-overlay" onClick={() => setSelectedFilter(null)}>
          <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
                  backgroundColor: slices.find(s => s.key === selectedFilter)?.color,
                }} />
                {selectedFilter === 'Active' ? 'Online Staff' : selectedFilter === 'On Break' ? 'Staff on Break' : 'Offline Staff'}
                <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 400 }}>
                  ({getList().length})
                </span>
              </h3>
              <button className="modal-close" onClick={() => setSelectedFilter(null)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '380px', overflowY: 'auto' }}>
              {getList().length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.85rem', padding: '2rem' }}>
                  No staff in this category.
                </p>
              ) : getList().map(item => (
                <div key={item.user.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', borderRadius: '10px',
                  backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
                }}>
                  <div className="user-initials-badge" style={{ width: '34px', height: '34px', fontSize: '0.75rem', flexShrink: 0 }}>
                    {getInitials(item.user.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.user.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{item.user.role}</span>
                    </div>
                    {item.clockStatus === 'Clocked In' && (
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                          Since {item.startedAt}
                        </span>
                        {item.taskName && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.taskName} {item.proj ? `· ${item.proj.name.split(' (')[0]}` : ''}
                          </p>
                        )}
                      </div>
                    )}
                    {item.clockStatus === 'On Break' && (
                      <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>On Break since {item.startedAt}</span>
                    )}
                    {item.clockStatus === 'Offline' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Not clocked in</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedFilter(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}