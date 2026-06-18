import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare, Clock, Check, ShieldAlert, Calendar,
  Video, Megaphone, MessageSquare, UserX, CalendarX,
  TrendingUp, Eye, EyeOff, ExternalLink, Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const TYPE_META = {
  TASK_ASSIGNED:      { icon: CheckSquare, color: 'var(--primary)', label: 'Task Assigned' },
  TASK_UPDATED:       { icon: Clock,        color: '#2dd4bf',        label: 'Task Updated' },
  TASK_REJECTED:      { icon: ShieldAlert,  color: '#ef4444',        label: 'Task Rejected' },
  TIMESHEET_APPROVED: { icon: Check,        color: '#4ade80',        label: 'Approved' },
  TIMESHEET_REJECTED: { icon: ShieldAlert,  color: '#ef4444',        label: 'Rejected' },
  APPROVAL_REVERTED:  { icon: Clock,        color: '#fbbf24',        label: 'Reverted' },
  BACKLOG_CLAIMED:    { icon: CheckSquare,  color: '#2dd4bf',        label: 'Backlog Claimed' },
  BACKLOG_CLAIM_REQUEST: { icon: CheckSquare, color: '#3b82f6',        label: 'Claim Request' },
  ETA_REQUEST:        { icon: Calendar,     color: '#fbbf24',        label: 'ETA Request' },
  ETA_DECISION:       { icon: Calendar,     color: '#fbbf24',        label: 'ETA Decision' },
  TRANSFER_REQUEST:   { icon: ShieldAlert,  color: '#c084fc',        label: 'Transfer Request' },
  TRANSFER_DECISION:  { icon: ShieldAlert,  color: '#c084fc',        label: 'Transfer Decision' },
  MEETING_REMINDER:   { icon: Video,        color: '#06b6d4',        label: 'Meeting' },
  ANNOUNCEMENT:       { icon: Megaphone,    color: '#ec4899',        label: 'Announcement' },
  WATCHDOG_LATE:      { icon: Clock,        color: '#fbbf24',        label: 'Late Check-in' },
  WATCHDOG_ABSENT:    { icon: UserX,        color: '#ef4444',        label: 'Absent' },
  overdue:            { icon: CalendarX,    color: '#ef4444',        label: 'Overdue' },
  overtime:           { icon: TrendingUp,   color: '#fbbf24',        label: 'Overtime' },
};

const DEFAULT_META = { icon: MessageSquare, color: '#8b939c', label: 'Notification' };

const isSystemGenerated = (id) =>
  id && (id.startsWith('overdue') || id.startsWith('overtime'));

export default function AlertCard({ notification: n, onNavigate, onToggleRead, onDelete }) {
  const { approveClaimRequest, rejectClaimRequest } = useApp();
  const { icon: Icon, color, label } = TYPE_META[n.type] || DEFAULT_META;
  const sys = isSystemGenerated(n.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem 1.125rem',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: '0.875rem',
        opacity: n.isRead ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Type icon */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} style={{ color }} />
      </div>

      {/* Body */}
      <div onClick={() => onNavigate(n)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.83rem',
            fontWeight: n.isRead ? 500 : 700,
            color: 'var(--foreground)',
          }}>
            {n.title}
          </span>
          {/* Type badge */}
          <span style={{
            fontSize: '0.62rem', fontWeight: 600,
            color,
            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 22%, transparent)`,
            borderRadius: 4, padding: '1px 6px', flexShrink: 0,
          }}>
            {label}
          </span>
          {/* Unread dot */}
          {!n.isRead && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: 'var(--primary)', flexShrink: 0,
            }} />
          )}
        </div>

        <p style={{
          fontSize: '0.73rem', color: 'var(--muted-foreground)',
          margin: '3px 0 0', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {n.message}
        </p>

        <span style={{
          fontSize: '0.63rem', color: 'var(--muted-foreground)',
          display: 'block', marginTop: 3,
        }}>
          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}
          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {n.type === 'BACKLOG_CLAIM_REQUEST' && !n.isRead && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={(e) => { e.stopPropagation(); approveClaimRequest(n); }}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Agree
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); rejectClaimRequest(n); }}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
                color: 'var(--destructive)',
                border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {!sys && (
          <button
            onClick={() => onToggleRead(n)}
            title={n.isRead ? 'Mark as unread' : 'Mark as read'}
            style={actionBtn()}
          >
            {n.isRead ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
        <button
          onClick={() => onNavigate(n)}
          title="View details"
          style={actionBtn('var(--primary)')}
        >
          <ExternalLink size={13} />
        </button>
        {!sys && (
          <button
            onClick={() => onDelete(n.id)}
            title="Dismiss"
            style={actionBtn('#ef4444')}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function actionBtn(accent) {
  if (!accent) return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 6,
    border: '1px solid var(--border)', background: 'none',
    color: 'var(--muted-foreground)', cursor: 'pointer',
  };
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 6,
    border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
    backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)`,
    color: accent, cursor: 'pointer',
  };
}