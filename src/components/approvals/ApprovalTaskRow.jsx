import React from 'react';
import { AlertTriangle, Check, X, RotateCcw, MessageSquare } from 'lucide-react';
import UserAvatar from '../ui/UserAvatar';
import PriorityBadge from '../ui/PriorityBadge';

/**
 * Helper to extract employee submission comments/justification
 */
const getSubmissionComment = (task) => {
  if (!task.comments || task.comments.length === 0) return null;
  // Find the latest comment containing "Submitted for Review"
  const subComment = [...task.comments]
    .reverse()
    .find(c => c.commentText && c.commentText.includes('Submitted for Review'));
  if (subComment) {
    const text = subComment.commentText;
    const match = text.match(/\[Submitted for Review - Comment\]:\s*(.*?)\.\s*Session hours:/);
    if (match) return match[1];
    
    const match2 = text.match(/\[Submitted for Review - Comment\]:\s*(.*)/);
    if (match2) return match2[1];
    
    return text.replace(/^\[Submitted for Review.*?\]:\s*/, '');
  }
  return null;
};

/**
 * ApprovalTaskRow
 * Props:
 *   task           — task object
 *   user           — assignee user object
 *   project        — project object | null
 *   showHistory    — bool (history mode vs pending mode)
 *   comment        — string (current feedback comment text)
 *   onCommentChange — (val) => void
 *   onApprove      — () => void
 *   onReject       — () => void
 *   onRevert       — () => void
 */
export default function ApprovalTaskRow({
  task,
  user,
  project,
  showHistory,
  comment,
  onCommentChange,
  onApprove,
  onReject,
  onRevert,
}) {
  const isOverrun = task && task.logged > task.eta;
  const employeeComment = task ? getSubmissionComment(task) : null;

  // Progress calculations
  const pct = task.eta > 0 ? Math.min(100, Math.round((task.logged / task.eta) * 100)) : 0;

  // Decision badge config
  const decisionCfg =
    task.completionReviewStatus === 'APPROVED'
      ? { color: '#22c55e', bg: '#22c55e14', border: '#22c55e30', label: 'Approved' }
      : { color: '#ef4444', bg: '#ef444414', border: '#ef444430', label: 'Rejected' };

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        borderLeft: isOverrun ? '3px solid #ef4444' : '3px solid transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--secondary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* 1. Employee */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserAvatar name={user.name} />
            <div>
              <div style={{ fontWeight: 650, fontSize: '0.82rem', color: 'var(--foreground)' }}>{user.name}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)', marginTop: 1 }}>{user.role || 'Employee'}</div>
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>Unassigned</span>
        )}
      </td>

      {/* 2. Task Details */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle', maxWidth: 350 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
              {task?.taskNumber || 'TASK'}
            </span>
            <span style={{ fontWeight: 650, fontSize: '0.82rem', color: 'var(--foreground)' }}>{task?.name}</span>
            {task?.priority && <PriorityBadge priority={task.priority} />}
          </div>
          {task?.description && (
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--muted-foreground)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {task.description}
            </span>
          )}
        </div>
      </td>

      {/* 3. Project */}
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

      {/* 4. Estimate vs Logged */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 160 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 650, color: 'var(--foreground)' }}>
            <span>{task.logged}h / {task.eta}h</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: isOverrun ? '#ef4444' : '#22c55e',
                borderRadius: 3,
              }}
            />
          </div>
          {isOverrun && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem', fontWeight: 700, color: '#ef4444' }}>
              <AlertTriangle size={10} />
              ETA EXCEEDED BY {(task.logged - task.eta).toFixed(1)}h
            </div>
          )}
        </div>
      </td>

      {/* 5. Employee Comment */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle' }}>
        {employeeComment ? (
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
            <MessageSquare size={12} style={{ color: 'var(--muted-foreground)', marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--foreground)', fontStyle: 'italic', wordBreak: 'break-word' }}>
              "{employeeComment}"
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', fontStyle: 'italic' }}>No comment</span>
        )}
      </td>

      {/* 6. Action */}
      <td style={{ padding: '0.875rem 1rem', verticalAlign: 'middle', width: 280 }}>
        {!showHistory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <input
              type="text"
              placeholder="Add review feedback (required to reject)..."
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
              {task.reviewComment && (
                <span
                  style={{
                    fontSize: '0.73rem',
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                    maxWidth: 180,
                    wordBreak: 'break-word',
                  }}
                >
                  "{task.reviewComment}"
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
