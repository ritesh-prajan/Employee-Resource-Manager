import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare, Clock, Check, ShieldAlert, Calendar,
  Video, Megaphone, MessageSquare, UserX, CalendarX,
  TrendingUp, Eye, EyeOff, ExternalLink, Trash2
} from 'lucide-react';

const TYPE_META = {
  TASK_ASSIGNED:      { icon: CheckSquare, color: '#0010AE' },
  TASK_UPDATED:       { icon: Clock,        color: '#2dd4bf' },
  TASK_REJECTED:      { icon: ShieldAlert,  color: '#ef4444' },
  TIMESHEET_APPROVED: { icon: Check,        color: '#4ade80' },
  TIMESHEET_REJECTED: { icon: ShieldAlert,  color: '#ef4444' },
  APPROVAL_REVERTED:  { icon: Clock,        color: '#fbbf24' },
  BACKLOG_CLAIMED:    { icon: CheckSquare,  color: '#2dd4bf' },
  ETA_REQUEST:        { icon: Calendar,     color: '#fbbf24' },
  ETA_DECISION:       { icon: Calendar,     color: '#fbbf24' },
  TRANSFER_REQUEST:   { icon: ShieldAlert,  color: '#c084fc' },
  TRANSFER_DECISION:  { icon: ShieldAlert,  color: '#c084fc' },
  MEETING_REMINDER:   { icon: Video,        color: '#06b6d4' },
  ANNOUNCEMENT:       { icon: Megaphone,    color: '#ec4899' },
  WATCHDOG_LATE:      { icon: Clock,        color: '#fbbf24' },
  WATCHDOG_ABSENT:    { icon: UserX,        color: '#ef4444' },
  overdue:            { icon: CalendarX,    color: '#ef4444' },
  overtime:           { icon: TrendingUp,   color: '#fbbf24' },
};

const DEFAULT_META = { icon: MessageSquare, color: '#8b939c' };

const isSystemGenerated = (id) =>
  id && (id.startsWith('overdue') || id.startsWith('overtime'));

export default function AlertCard({ notification: n, onNavigate, onToggleRead, onDelete }) {
  const { icon: Icon, color } = TYPE_META[n.type] || DEFAULT_META;
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
        padding: '1rem 1.25rem',
        gap: '1rem',
        borderLeft: `4px solid ${color}`,
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${color}`,
        borderRadius: '0.875rem',
        opacity: n.isRead ? 0.72 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Type icon circle */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        backgroundColor: 'var(--secondary)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} style={{ color }} />
      </div>

      {/* Body — clickable */}
      <div
        onClick={() => onNavigate(n)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        title="Click to go to details"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: n.isRead ? 600 : 750,
            color: 'var(--foreground)',
          }}>
            {n.title}
          </span>
          {!n.isRead && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: '#0010AE', flexShrink: 0,
            }} />
          )}
        </div>
        <p style={{
          fontSize: '0.75rem', color: 'var(--muted-foreground)',
          margin: '3px 0 0', textOverflow: 'ellipsis',
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          {n.message}
        </p>
        <span style={{
          fontSize: '0.65rem', color: 'var(--muted-foreground)',
          display: 'block', marginTop: 4,
        }}>
          {new Date(n.createdAt).toLocaleDateString()} at{' '}
          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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
          style={actionBtn('#0010AE')}
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