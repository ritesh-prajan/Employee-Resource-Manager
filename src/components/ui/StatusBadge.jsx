import React from 'react';

const STATUS_CONFIG = {
  'Open':           { color: 'var(--muted-foreground)', bg: 'var(--muted)' },
  'In Progress':    { color: 'var(--chart-1)',           bg: 'color-mix(in oklch, var(--chart-1) 12%, transparent)' },
  'Pending Review': { color: '#f59e0b',                  bg: '#f59e0b1a' },
  'Completed':      { color: '#22c55e',                  bg: '#22c55e1a' },
  'Backlog':        { color: '#a855f7',                  bg: '#a855f71a' },
  'Cancelled':      { color: '#ef4444',                  bg: '#ef44441a' },
};

/**
 * StatusBadge
 * Props:
 *   status — string matching STATUS_CONFIG keys
 */
export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: 'var(--muted-foreground)', bg: 'var(--muted)' };
  return (
    <span style={{
      fontSize: '0.65rem',
      fontWeight: 700,
      padding: '2px 7px',
      borderRadius: '5px',
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}30`,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}