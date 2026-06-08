import React from 'react';
import { Clock, CheckSquare, AlertTriangle, FileText, Archive, Users } from 'lucide-react';

const cards = [
  {
    key: 'staffOnline',
    label: 'STAFF ONLINE NOW',
    icon: Users,
    accent: '#22c55e',
    pulse: true,
    format: (v) => `${v.count} / ${v.total}`,
    danger: false,
    page: 'admin-employees',
  },
  {
    key: 'hoursToday',
    label: 'HOURS LOGGED TODAY',
    icon: Clock,
    accent: 'var(--primary)',
    format: (v) => `${v.toFixed(1)}h`,
    danger: false,
    page: 'admin-timesheets',
  },
  {
    key: 'openTasks',
    label: 'OPEN TASKS',
    icon: CheckSquare,
    accent: 'var(--primary)',
    format: (v) => v,
    danger: false,
    page: 'admin-tasks',
  },
  {
    key: 'overdueTasks',
    label: 'OVERDUE TASKS',
    icon: AlertTriangle,
    accent: '#ef4444',
    format: (v) => v,
    danger: true,
    page: 'admin-tasks',
  },
  {
    key: 'pendingApprovals',
    label: 'PENDING APPROVALS',
    icon: FileText,
    accent: '#f59e0b',
    format: (v) => v,
    danger: false,
    page: 'admin-approvals',
  },
  {
    key: 'backlogSize',
    label: 'BACKLOG SIZE',
    icon: Archive,
    accent: 'var(--muted-foreground)',
    format: (v) => v,
    danger: false,
    page: 'admin-backlog',
  },
];

export default function KpiCards({ kpis, onNavigate }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '0.75rem',
      flexShrink: 0,
    }}>
      {cards.map(({ key, label, icon: Icon, accent, pulse, format, danger, page }) => {
        const value = kpis[key];
        const isDanger = danger && value > 0;

        return (
          <div
            key={key}
            onClick={() => onNavigate(page)}
            style={{
              backgroundColor: 'var(--card)',
              border: `1px solid ${isDanger ? '#ef444430' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '1rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = isDanger ? '#ef4444' : accent;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = isDanger ? '#ef444430' : 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.07em',
                color: 'var(--muted-foreground)',
              }}>
                {label}
              </span>
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                backgroundColor: `${isDanger ? '#ef4444' : accent}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={13} color={isDanger ? '#ef4444' : accent} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                fontSize: '1.4rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: isDanger ? '#ef4444' : 'var(--foreground)',
                lineHeight: 1,
              }}>
                {format(value)}
              </span>
              {pulse && (
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  animation: 'kpiPulse 2s infinite',
                  flexShrink: 0,
                }} />
              )}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes kpiPulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  );
}