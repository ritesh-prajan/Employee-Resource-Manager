import React from 'react';
import { CheckSquare, AlertTriangle, Clock, UserCheck, Calendar, Archive } from 'lucide-react';

const cards = [
  {
    key: 'activeTasks',
    label: 'ACTIVE TASKS',
    icon: CheckSquare,
    accent: '#3b82f6',
    danger: false,
    page: '/tasks',
  },
  {
    key: 'overdueTasks',
    label: 'ETA OVERDUE',
    icon: AlertTriangle,
    accent: '#ef4444',
    danger: true,
    page: '/tasks',
  },
  {
    key: 'hoursThisWeek',
    label: 'HOURS LOGGED',
    icon: Clock,
    accent: '#8b5cf6',
    danger: false,
    page: '/timesheet',
  },
  {
    key: 'completedTasks',
    label: 'COMPLETED TASKS',
    icon: UserCheck,
    accent: '#10b981',
    danger: false,
    page: '/tasks',
  },
  {
    key: 'pendingETAs',
    label: 'PENDING EXTENSIONS',
    icon: Calendar,
    accent: '#f59e0b',
    danger: false,
  },
  {
    key: 'pendingTransfers',
    label: 'PENDING TRANSFERS',
    icon: Archive,
    accent: '#6b7280',
    danger: false,
  },
];

export default function EmployeeKpiCards({ kpis, onNavigate }) {
  return (
    <div className="kpi-cards-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '0.75rem',
      flexShrink: 0,
    }}>
      {cards.map(({ key, label, icon: Icon, accent, danger, page }) => {
        const value = kpis[key];
        const isDanger = danger && value > 0;
        const clickable = !!page && !!onNavigate;

        return (
          <div
            key={key}
            onClick={() => clickable && onNavigate(page)}
            style={{
              backgroundColor: 'var(--card)',
              border: `1px solid ${isDanger ? '#ef444430' : 'var(--border)'}`,
              borderRadius: '12px',
              padding: '1rem 1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: clickable ? 'pointer' : 'default',
              transition: 'border-color 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              if (clickable) {
                e.currentTarget.style.borderColor = isDanger ? '#ef4444' : accent;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (clickable) {
                e.currentTarget.style.borderColor = isDanger ? '#ef444430' : 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }
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
                {value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
