import React from 'react';
import { Clock, History } from 'lucide-react';

/**
 * ApprovalTabToggle
 * Props:
 *   showHistory     — bool
 *   onToggle        — (bool) => void
 *   pendingCount    — number
 *   historyCount    — number
 */
export default function ApprovalTabToggle({ showHistory, onToggle, pendingCount, historyCount }) {
  const tabs = [
    { label: 'Pending Approval', icon: <Clock size={13} />, count: pendingCount, value: false },
    { label: 'Approval History', icon: <History size={13} />, count: historyCount, value: true },
  ];

  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--secondary)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {tabs.map(({ label, icon, count, value }) => {
        const active = showHistory === value;
        return (
          <button
            key={label}
            onClick={() => onToggle(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 1rem',
              fontSize: '0.775rem',
              fontWeight: 650,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {icon}
            {label}
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '20px',
                background: active ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}