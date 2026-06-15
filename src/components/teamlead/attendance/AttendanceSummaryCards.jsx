// components/teamlead/attendance/AttendanceSummaryCards.jsx
import React from 'react';
import { CheckCircle2, Home, Calendar, XCircle } from 'lucide-react';
import KpiCard from '../../teamlead/KpiCard';

const CARDS = [
  { key: 'Present',  label: 'Present',  icon: CheckCircle2, accent: '#22c55e' },
  { key: 'WFH',      label: 'WFH',      icon: Home,         accent: '#3b82f6' },
  { key: 'Leave',    label: 'On Leave', icon: Calendar,     accent: '#ef4444' },
  { key: 'Absent',   label: 'Absent',   icon: XCircle,      accent: '#f59e0b' },
];

/**
 * Props:
 *   summary       — { Present, WFH, Leave, Absent }
 *   filterStatus  — currently active filter string
 *   onFilter      — (key) => void  — toggles filter on card click
 */
export default function AttendanceSummaryCards({ summary, filterStatus, onFilter }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {CARDS.map(({ key, label, icon, accent }) => {
        const active = filterStatus === key;
        return (
          <div
            key={key}
            style={{
              flex: 1, minWidth: 120,
              outline: active ? `2px solid ${accent}` : '2px solid transparent',
              borderRadius: 12,
              transition: 'outline 0.15s',
            }}
          >
            <KpiCard
              icon={icon}
              label={label}
              value={summary[key] ?? 0}
              accent={accent}
              onClick={() => onFilter(key)}
            />
          </div>
        );
      })}
    </div>
  );
}