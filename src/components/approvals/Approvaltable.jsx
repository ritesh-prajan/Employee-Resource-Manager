import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import ApprovalEntryRow from './ApprovalEntryRow';

const PAGE_SIZE = 8;

const COL_HEADERS = [
  { label: 'Employee',           width: undefined },
  { label: 'Date & Category',    width: 130 },
  { label: 'Task & Description', width: undefined },
  { label: 'Project',            width: 130 },
  { label: 'Hours',              width: 110 },
  { label: 'Action',             width: 260 },
];

/**
 * ApprovalTable
 * Props:
 *   entries         — filtered time entry array
 *   showHistory     — bool
 *   users           — all users
 *   tasks           — all tasks
 *   projects        — all projects
 *   comments        — { [entryId]: string }
 *   onCommentChange — (entryId, val) => void
 *   onApprove       — (entryId) => void
 *   onReject        — (entryId) => void
 *   onRevert        — (entryId) => void
 */
export default function ApprovalTable({
  entries,
  showHistory,
  users,
  tasks,
  projects,
  comments,
  onCommentChange,
  onApprove,
  onReject,
  onRevert,
}) {
  const [page, setPage] = useState(0);

  // Reset page when entries change
  React.useEffect(() => { setPage(0); }, [entries.length, showHistory]);

  const totalPages = Math.ceil(entries.length / PAGE_SIZE);
  const paged = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getUser    = (id) => users.find((u) => u.id === id);
  const getTask    = (id) => tasks.find((t) => t.id === id);
  const getProject = (id) => projects.find((p) => p.id === id);

  if (entries.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '4rem 2rem',
          borderRadius: '14px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        <UserCheck size={32} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
          {showHistory ? 'No decisions recorded yet.' : 'No entries pending approval.'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', opacity: 0.7 }}>
          {showHistory ? 'Approved or rejected entries will appear here.' : 'All time logs are up to date.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--secondary)' }}>
              {COL_HEADERS.map(({ label, width }) => (
                <th
                  key={label}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '0.67rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--muted-foreground)',
                    whiteSpace: 'nowrap',
                    ...(width ? { width } : {}),
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((entry) => {
              const user    = getUser(entry.userId);
              const task    = getTask(entry.taskId);
              const project = getProject(entry.projectId);
              if (!user || !task) return null;
              return (
                <ApprovalEntryRow
                  key={entry.id}
                  entry={entry}
                  user={user}
                  task={task}
                  project={project}
                  showHistory={showHistory}
                  comment={comments[entry.id] || ''}
                  onCommentChange={(val) => onCommentChange(entry.id, val)}
                  onApprove={() => onApprove(entry.id)}
                  onReject={() => onReject(entry.id)}
                  onRevert={() => onRevert(entry.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--secondary)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, entries.length)} of {entries.length} entries
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: page === 0 ? 'var(--muted-foreground)' : 'var(--foreground)',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                opacity: page === 0 ? 0.4 : 1,
              }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  background: i === page ? 'var(--primary)' : 'var(--card)',
                  color: i === page ? 'var(--primary-foreground)' : 'var(--foreground)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: page === totalPages - 1 ? 'var(--muted-foreground)' : 'var(--foreground)',
                cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
                opacity: page === totalPages - 1 ? 0.4 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}