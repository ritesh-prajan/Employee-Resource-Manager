import React, { useState } from 'react';
import { Briefcase } from 'lucide-react';
import ApprovalTaskRow from './ApprovalTaskRow';
import Pagination from '../ui/Pagination';

const COL_HEADERS = [
  { label: 'Employee',           width: undefined },
  { label: 'Task Details',       width: undefined },
  { label: 'Project',            width: 130 },
  { label: 'Estimate vs Logged', width: 200 },
  { label: 'Employee Comment',   width: 240 },
  { label: 'Action',             width: 280 },
];

/**
 * ApprovalTaskTable
 * Props:
 *   tasks           — filtered tasks array
 *   showHistory     — bool
 *   users           — all users
 *   projects        — all projects
 *   comments        — { [taskId]: string }
 *   onCommentChange — (taskId, val) => void
 *   onApprove       — (taskId) => void
 *   onReject        — (taskId) => void
 *   onRevert        — (taskId) => void
 */
export default function ApprovalTaskTable({
  tasks,
  showHistory,
  users,
  projects,
  comments,
  onCommentChange,
  onApprove,
  onReject,
  onRevert,
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  React.useEffect(() => {
    setPageIndex(0);
  }, [tasks.length, showHistory]);

  const totalPages = Math.ceil(tasks.length / pageSize);
  const paged = tasks.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const getUser = (id) => users.find((u) => u.id === id);
  const getProject = (id) => projects.find((p) => p.id === id);

  const table = {
    setPageIndex,
    setPageSize,
    previousPage: () => setPageIndex((p) => Math.max(0, p - 1)),
    nextPage:     () => setPageIndex((p) => Math.min(totalPages - 1, p + 1)),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage:     () => pageIndex < totalPages - 1,
    getPageCount:       () => totalPages,
  };

  if (tasks.length === 0) {
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
        <Briefcase size={32} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
          {showHistory ? 'No task decisions recorded yet.' : 'No tasks pending completion review.'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', opacity: 0.7 }}>
          {showHistory ? 'Approved or rejected task reviews will appear here.' : 'All task completion reviews are up to date.'}
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
            {paged.map((task) => {
              const user    = getUser(task.assignedTo);
              const project = getProject(task.projectId);
              return (
                <ApprovalTaskRow
                  key={task.id}
                  task={task}
                  user={user}
                  project={project}
                  showHistory={showHistory}
                  comment={comments[task.id] || ''}
                  onCommentChange={(val) => onCommentChange(task.id, val)}
                  onApprove={() => onApprove(task.id)}
                  onReject={() => onReject(task.id)}
                  onRevert={() => onRevert(task.id)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <Pagination
        table={table}
        pagination={{ pageIndex, pageSize }}
        totalRows={tasks.length}
      />
    </div>
  );
}
