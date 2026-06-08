import React from 'react';

const PRIORITY_CONFIG = {
  'Critical': { color: '#ef4444', bg: '#ef44441a' },
  'High':     { color: '#f97316', bg: '#f973161a' },
  'Medium':   { color: '#f59e0b', bg: '#f59e0b1a' },
  'Low':      { color: '#22c55e', bg: '#22c55e1a' },
};

/**
 * PriorityBadge
 * Props:
 *   priority — string matching PRIORITY_CONFIG keys
 */
export default function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || { color: 'var(--muted-foreground)', bg: 'var(--muted)' };
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
      {priority}
    </span>
  );
}