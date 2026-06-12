import React from 'react';
import { AlertTriangle, Check, X, RotateCcw } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import PriorityBadge from '../ui/PriorityBadge';

/**
 * ApprovalEntryRow
 * Props:
 *   entry          — time entry object
 *   user           — user object
 *   task           — task object
 *   project        — project object | null
 *   showHistory    — bool (history mode vs pending mode)
 *   comment        — string (current comment text for this entry)
 *   onCommentChange — (val) => void
 *   onApprove      — () => void
 *   onReject       — () => void
 *   onRevert       — () => void
 */
export default function ApprovalEntryRow({
  entry,
  user,
  task,
  project,
  showHistory,
  comment,
  onCommentChange,
  onApprove,
  onReject,
  onRevert,
}) {
  const isOverrun = task && task.logged > task.eta;
  const hasJustification = Boolean(entry.justification);

  // Left border colour: overrun = danger, within ETA with justification = green, else none
  const borderLeft = hasJustification
    ? isOverrun
      ? '3px solid #ef4444'
      : '3px solid #22c55e'
    : '3px solid transparent';

  // Decision badge config
  const decisionCfg =
    entry.status === 'Approved'
      ? { color: '#22c55e', bg: '#22c55e14', border: '#22c55e30', label: 'Approved' }
      : { color: '#ef4444', bg: '#ef444414', border: '#ef444430', label: 'Rejected' };

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        borderLeft,
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* 1. Employee */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <UserAvatar name={user.name} />
          <div>
            <div style={{ fontWeight: 650, fontSize: '0.82rem', color: 'var(--foreground)' }}>{user.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', marginTop: 1 }}>{user.role || 'Employee'}</div>
          </div>
        </div>
      </td>

      {/* 2. Date & Category */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--foreground)' }}>{entry.date}</span>
          <span
            style={{
              fontSize: '0.67rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              width: 'fit-content',
              background: 'var(--accent)',
              color: 'var(--primary)',
              border: '1px solid var(--border)',
            }}
          >
            {entry.workCategory || 'Story'}
          </span>
        </div>
      </td>

      {/* 3. Task & Description */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle', maxWidth: 380 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Task number + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--muted-foreground)',
                whiteSpace: 'nowrap',
              }}
            >
              {task?.taskNumber}
            </span>
            <span style={{ fontWeight: 650, fontSize: '0.82rem', color: 'var(--foreground)' }}>{task?.name}</span>
            {task?.priority && <PriorityBadge priority={task.priority} />}
          </div>

          {/* Log description */}
          {entry.description && (
            <span style={{ fontSize: '0.77rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
              "{entry.description}"
            </span>
          )}

          {/* Justification / overrun banner */}
          {hasJustification && (
            <div
              style={{
                marginTop: 2,
                padding: '0.45rem 0.7rem',
                borderRadius: '7px',
                background: isOverrun ? '#ef444408' : '#22c55e08',
                border: `1px solid ${isOverrun ? '#ef444428' : '#22c55e28'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.67rem',
                  fontWeight: 700,
                  color: isOverrun ? '#ef4444' : '#22c55e',
                }}
              >
                {isOverrun ? <AlertTriangle size={10} /> : <Check size={10} />}
                {isOverrun
                  ? `ETA EXCEEDED — limit ${task.eta}h, logged ${task.logged}h`
                  : 'COMPLETED WITHIN ETA'}
              </div>
              <span style={{ fontSize: '0.73rem', fontStyle: 'italic', color: 'var(--foreground)' }}>
                "{entry.justification}"
              </span>
            </div>
          )}
        </div>
      </td>

      {/* 4. Project */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        {project ? (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '5px',
              background: `${project.color}18`,
              color: project.color,
              border: `1px solid ${project.color}30`,
              whiteSpace: 'nowrap',
            }}
          >
            {project.name.split(' (')[0]}
          </span>
        ) : (
          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>—</span>
        )}
      </td>

      {/* 5. Hours */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--foreground)', fontFamily: 'var(--font-mono)' }}>
            {entry.duration}h
          </span>
          <span style={{ fontSize: '0.67rem', color: 'var(--muted-foreground)' }}>
            {entry.startTime} – {entry.endTime}
          </span>
          {task && (
            <span style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', marginTop: 1 }}>
              Task total: {task.logged}h / {task.eta}h ETA
            </span>
          )}
        </div>
      </td>

      {/* 6. Action */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle', width: 260 }}>
        {!showHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <input
              type="text"
              placeholder="Add feedback (required to reject)..."
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.65rem',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                background: 'var(--secondary)',
                color: 'var(--foreground)',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={onReject}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '0.38rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 650,
                  borderRadius: '7px',
                  border: '1px solid #ef444440',
                  background: '#ef444408',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#ef444418')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ef444408')}
              >
                <X size={11} /> Reject
              </button>
              <button
                onClick={onApprove}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '0.38rem 0.6rem',
                  fontSize: '0.72rem',
                  fontWeight: 650,
                  borderRadius: '7px',
                  border: '1px solid #22c55e40',
                  background: '#22c55e10',
                  color: '#22c55e',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#22c55e20')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#22c55e10')}
              >
                <Check size={11} /> Approve
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {/* Decision badge */}
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '5px',
                  background: decisionCfg.bg,
                  color: decisionCfg.color,
                  border: `1px solid ${decisionCfg.border}`,
                  width: 'fit-content',
                }}
              >
                {decisionCfg.label}
              </span>
              {entry.managerComment && (
                <span
                  style={{
                    fontSize: '0.73rem',
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                    maxWidth: 170,
                    wordBreak: 'break-word',
                  }}
                >
                  "{entry.managerComment}"
                </span>
              )}
            </div>
            <button
              onClick={onRevert}
              title="Revert decision to Pending"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0.35rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: 650,
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--muted-foreground)';
              }}
            >
              <RotateCcw size={11} /> Undo
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}