import React, { useState } from 'react';
import { X, Clock, Calendar, Coffee, CheckCircle2, XCircle, Home } from 'lucide-react';
import Modal from '../../ui/Modal';
import UserAvatar from '../../ui/UserAvatar';
import AttendanceStatusPill from './AttendanceStatusPill';

const TODAY = new Date().toISOString().split('T')[0];

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function getWorkdaysInMonth(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    if (d.getDay() === 0 || d.getDay() === 6) return null;
    return d.toISOString().split('T')[0];
  }).filter(Boolean);
}

// ── Stat pill used inside modal header ────────────────────────────────────────
function StatChip({ icon: Icon, value, label, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: accent + '12', border: `1px solid ${accent}25`,
      borderRadius: 8, padding: '5px 12px',
    }}>
      <Icon size={13} color={accent} />
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: accent }}>{value}</span>
      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>{label}</span>
    </div>
  );
}

/**
 * Props:
 *   member            — user object
 *   attendanceHistory — full array from context
 *   onClose           — () => void
 */
export default function AttendanceDetailModal({ member, attendanceHistory, onClose }) {
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current month

  if (!member) return null;

  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const workdays = getWorkdaysInMonth(targetMonth.getFullYear(), targetMonth.getMonth());

  // Build lookup map for this member
  const attMap = {};
  attendanceHistory.filter(a => a.employeeId === member.id).forEach(a => { attMap[a.date] = a; });

  // Month stats
  const stats = { Present: 0, WFH: 0, Leave: 0, Absent: 0 };
  let totalHours = 0;
  workdays.forEach(d => {
    const rec = attMap[d];
    if (!rec) { if (d <= TODAY) stats.Absent++; }
    else {
      stats[rec.status] = (stats[rec.status] || 0) + 1;
      totalHours += parseFloat(rec.totalWorkHours || 0);
    }
  });

  // Rows — most recent first, skip future days
  const rows = workdays
    .map(date => {
      const rec = attMap[date];
      return {
        date,
        status:   rec?.status  || (date <= TODAY ? 'Absent' : null),
        clockIn:  rec?.clockIn  || null,
        clockOut: rec?.clockOut || null,
        hours:    rec ? parseFloat(rec.totalWorkHours || 0).toFixed(1) + 'h' : '—',
        breaks:   rec?.breaks?.length || 0,
        isFuture: date > TODAY,
      };
    })
    .reverse();

  return (
    <Modal isOpen={!!member} onClose={onClose} maxWidth="820px">
      {/* ── Header ── */}
      <div style={{
        padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <UserAvatar name={member.name} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>{member.name}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
              <span style={{
                fontSize: '0.7rem', background: 'var(--muted)', color: 'var(--muted-foreground)',
                padding: '1px 8px', borderRadius: 20, fontWeight: 600,
              }}>{member.role}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                {member.designation || member.department || 'General'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4, borderRadius: 6, display: 'flex' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Month nav + stat chips ── */}
      <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid var(--border)' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.875rem' }}>
          <button
            onClick={() => setMonthOffset(o => o - 1)}
            style={{ background: 'var(--muted)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', color: 'var(--foreground)', fontSize: '0.85rem', fontWeight: 700 }}
          >‹</button>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--foreground)', minWidth: 140, textAlign: 'center' }}>
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset(o => Math.min(o + 1, 0))}
            disabled={monthOffset >= 0}
            style={{
              background: 'var(--muted)', border: 'none', borderRadius: 6, padding: '4px 12px',
              cursor: monthOffset >= 0 ? 'not-allowed' : 'pointer',
              color: monthOffset >= 0 ? 'var(--muted-foreground)' : 'var(--foreground)',
              fontSize: '0.85rem', fontWeight: 700, opacity: monthOffset >= 0 ? 0.35 : 1,
            }}
          >›</button>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <StatChip icon={CheckCircle2} value={stats.Present} label="Present" accent="#22c55e" />
          <StatChip icon={Home}         value={stats.WFH}     label="WFH"     accent="#3b82f6" />
          <StatChip icon={Calendar}     value={stats.Leave}   label="Leave"   accent="#ef4444" />
          <StatChip icon={XCircle}      value={stats.Absent}  label="Absent"  accent="#f59e0b" />
          <StatChip icon={Clock}        value={totalHours.toFixed(1) + 'h'} label="Total hrs" accent="#8b5cf6" />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowY: 'auto', maxHeight: '52vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, background: 'var(--card)', zIndex: 1 }}>
              {['Date', 'Status', 'Clock In', 'Clock Out', 'Hours', 'Breaks'].map(h => (
                <th key={h} style={{
                  padding: '0.65rem 1.25rem', textAlign: 'left',
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
                  color: 'var(--muted-foreground)', textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.date}
                style={{
                  borderBottom: '1px solid var(--border)',
                  opacity: row.isFuture ? 0.35 : 1,
                  background: row.date === TODAY
                    ? 'color-mix(in oklch, var(--primary) 4%, transparent)'
                    : 'transparent',
                }}
              >
                <td style={{ padding: '0.65rem 1.25rem', color: 'var(--foreground)', whiteSpace: 'nowrap', fontWeight: row.date === TODAY ? 700 : 400 }}>
                  {fmtDate(row.date)}
                  {row.date === TODAY && (
                    <span style={{ marginLeft: 6, fontSize: '0.62rem', background: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                      Today
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.65rem 1.25rem' }}>
                  {row.isFuture || !row.status
                    ? <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                    : <AttendanceStatusPill status={row.status} />
                  }
                </td>
                <td style={{ padding: '0.65rem 1.25rem', color: 'var(--foreground)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {row.isFuture ? '—' : fmtTime(row.clockIn)}
                </td>
                <td style={{ padding: '0.65rem 1.25rem', color: 'var(--foreground)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {row.isFuture ? '—' : fmtTime(row.clockOut)}
                </td>
                <td style={{ padding: '0.65rem 1.25rem', color: 'var(--foreground)', fontWeight: 600 }}>
                  {row.isFuture ? '—' : row.hours}
                </td>
                <td style={{ padding: '0.65rem 1.25rem', color: 'var(--muted-foreground)' }}>
                  {row.isFuture ? '—' : row.breaks > 0
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Coffee size={12} />{row.breaks}</span>
                    : '—'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}