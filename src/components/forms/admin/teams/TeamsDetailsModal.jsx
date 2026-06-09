import React from 'react';
import Modal from '../../../ui/Modal';

/**
 * TeamsDetailsModal
 * Props:
 *   isOpen  — bool
 *   onClose — fn
 *   team    — team object { id, name, leadId, members, createdAt }
 *   users   — full users array from AppContext
 *   tasks   — full tasks array from AppContext (to count active tasks per member)
 */
export default function TeamsDetailsModal({ isOpen, onClose, team, users = [], tasks = [] }) {
  if (!isOpen || !team) return null;

  const lead = users.find(u => u.id === team.leadId);
  const teamMembers = users.filter(u => team.members.includes(u.id));

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const activeTasks = (userId) =>
    tasks.filter(t => t.assignedTo === userId && t.status !== 'Completed' && t.status !== 'Cancelled').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="850px">
      {/* Header */}
      <div className="modal-header" style={{ borderBottom: '3px solid var(--primary)', paddingBottom: '1rem' }}>
        <div>
          <h3 className="modal-title">👥 {team.name}</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            Team Directory & Members
          </span>
        </div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.25rem' }}>

        {/* Team Lead */}
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Team Lead
          </span>
          {lead ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.85rem', borderRadius: '10px',
              backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
            }}>
              <div className="user-initials-badge" style={{ width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                {getInitials(lead.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)' }}>{lead.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{lead.role} · {lead.department}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{lead.email}</div>
              </div>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)',
              }}>LEAD</span>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No lead assigned</span>
          )}
        </div>

        {/* Members */}
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Team Members ({teamMembers.length})
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '320px', overflowY: 'auto' }}>
            {teamMembers.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No members in this team yet.</span>
            ) : teamMembers.map(m => {
              const count = activeTasks(m.id);
              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.85rem', borderRadius: '10px',
                  backgroundColor: 'var(--secondary)', border: '1px solid var(--border)',
                }}>
                  <div className="user-initials-badge" style={{ width: 30, height: 30, fontSize: '0.7rem', flexShrink: 0 }}>
                    {getInitials(m.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>{m.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{m.role} · {m.department}</div>
                  </div>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: '10px',
                    backgroundColor: 'rgba(0,16,174,0.08)', color: 'var(--primary)',
                  }}>
                    {count} active task{count !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
      </div>
    </Modal>
  );
}