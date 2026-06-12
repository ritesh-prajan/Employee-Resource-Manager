import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * ApprovalKpiBar
 * Props:
 *   pendingCount   — number of entries awaiting approval
 *   approvedCount  — number approved entries (history)
 *   rejectedCount  — number rejected entries (history)
 *   overrunCount   — number of entries that exceed task ETA
 */
export default function ApprovalKpiBar({ pendingCount, approvedCount, rejectedCount, overrunCount }) {
  const tiles = [
    {
      icon: <Clock size={16} />,
      label: 'Pending Review',
      value: pendingCount,
      color: '#f59e0b',
      bg: '#f59e0b12',
      border: '#f59e0b30',
    },
    {
      icon: <CheckCircle size={16} />,
      label: 'Approved',
      value: approvedCount,
      color: '#22c55e',
      bg: '#22c55e12',
      border: '#22c55e30',
    },
    {
      icon: <XCircle size={16} />,
      label: 'Rejected',
      value: rejectedCount,
      color: '#ef4444',
      bg: '#ef444412',
      border: '#ef444430',
    },
    {
      icon: <AlertTriangle size={16} />,
      label: 'ETA Overruns',
      value: overrunCount,
      color: '#ef4444',
      bg: '#ef444412',
      border: '#ef444430',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      {tiles.map(({ icon, label, value, color, bg, border }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: bg,
              border: `1px solid ${border}`,
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted-foreground)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}