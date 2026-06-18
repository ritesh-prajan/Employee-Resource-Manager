import React from 'react';
import { motion } from 'motion/react';
import { CalendarX, ExternalLink, User, Briefcase, Users } from 'lucide-react';

export default function OverdueCard({ task, users, projects, teams, onNavigate }) {
  const assignee = users.find(u => u.id === task.assignedTo);
  const project  = projects.find(p => p.id === task.projectId);
  const team     = teams.find(tm => tm.members.includes(task.assignedTo));

  const daysOverdue = task.etaDate
    ? Math.max(0, Math.floor((new Date() - new Date(task.etaDate)) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'flex',
        gap: '1rem',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--destructive)',
        borderRadius: '0.875rem',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        backgroundColor: 'color-mix(in srgb, var(--destructive) 12%, transparent)',
        border: '1px solid color-mix(in srgb, var(--destructive) 22%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '2px',
      }}>
        <CalendarX size={15} style={{ color: 'var(--destructive)' }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
            {task.taskNumber}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {task.name}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--destructive)',
            backgroundColor: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--destructive) 25%, transparent)',
            borderRadius: 4, padding: '1px 7px', flexShrink: 0,
          }}>
            Overdue{daysOverdue !== null ? ` · ${daysOverdue}d` : ''}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 600,
            color: 'var(--muted-foreground)',
            backgroundColor: 'var(--secondary)',
            border: '1px solid var(--border)',
            borderRadius: 4, padding: '1px 7px', flexShrink: 0,
          }}>
            {task.status}
          </span>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.4rem' }}>
          {assignee && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', color: 'var(--muted-foreground)' }}>
              <User size={11} /> {assignee.name}
            </span>
          )}
          {project && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', color: 'var(--muted-foreground)' }}>
              <Briefcase size={11} /> {project.name}
            </span>
          )}
          {team && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', color: 'var(--muted-foreground)' }}>
              <Users size={11} /> {team.name}
            </span>
          )}
        </div>

        {/* ETA date */}
        {task.etaDate && (
          <span style={{ fontSize: '0.67rem', color: 'var(--destructive)', fontWeight: 600 }}>
            ETA was: {new Date(task.etaDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Navigate button */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}>
        <button
          onClick={onNavigate}
          title="View task"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 6, cursor: 'pointer',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            color: 'var(--primary)',
          }}
        >
          <ExternalLink size={13} />
        </button>
      </div>
    </motion.div>
  );
}