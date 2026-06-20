import React from 'react';
import Modal from '../../../ui/Modal';
import StatusBadge from '../../../ui/StatusBadge';
import PriorityBadge from '../../../ui/PriorityBadge';
export default function TaskDetailModal({ isOpen, onClose, task, users = [], projects = [] }) {
  if (!isOpen || !task) return null;
  const assignee = users.find(u => u.id === task.assignedTo);
  const proj = projects.find(p => p.id === task.projectId);
  const logged = task.logged || 0;
  const eta = task.eta || 0;
  const pct = eta > 0 ? Math.min(100, Math.round((logged / eta) * 100)) : 0;
  const isOverBudget = eta > 0 && logged > eta;
  const Field = ({ label, children }) => (
    <div>
      <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
        {children}
      </span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="850px">
      {/* Header */}
      <div className="modal-header" style={{ borderBottom: `3px solid ${proj?.color || 'var(--border)'}` }}>
        <div>
          {task.taskNumber && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
              backgroundColor: 'var(--secondary)', color: 'var(--muted-foreground)',
              display: 'inline-block', marginBottom: '0.3rem',
            }}>
              {task.taskNumber}
            </span>
          )}
          <h3 className="modal-title">{task.name}</h3>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.25rem' }}>

        {/* Info grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
          padding: '0.85rem', borderRadius: '10px',
          backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
        }}>
          <Field label="Project">
            <span style={{ color: proj?.color || 'var(--foreground)' }}>
              {proj ? proj.name.split(' (')[0] : '—'}
            </span>
          </Field>
          <Field label="Assigned To">{assignee?.name || 'Unassigned'}</Field>
          <Field label="Priority"><PriorityBadge priority={task.priority} /></Field>
          <Field label="Status"><StatusBadge status={task.status} /></Field>
          {task.etaDate && <Field label="Due Date">{task.etaDate}</Field>}
          {task.type && <Field label="Type">{task.type}</Field>}
        </div>



      </div>

      <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
      </div>
    </Modal>
  );
}