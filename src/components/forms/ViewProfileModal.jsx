import React from 'react';
import UserAvatar from '../ui/UserAvatar';

export default function ViewProfileModal({ show, onClose, user, teams, projects, getUserTasksCount }) {
  if (!show || !user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Employee Profile</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
            <UserAvatar name={user.name} size={52} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{user.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{user.designation || user.department || 'General'}</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#475569' }}>{user.role}</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: user.status === 'Active' ? '#10b981' : user.status === 'On Break' ? '#f59e0b' : '#94a3b8' }}>
                ● {user.status}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'EMPLOYEE ID', value: user.employee_code || '-' },
              { label: 'PHONE', value: user.phone || '-' },
              { label: 'WORK EMAIL', value: user.email },
              { label: 'PERSONAL EMAIL', value: user.personalEmail || '-' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Teams */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>TEAMS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {teams.filter(t => t.members.includes(user.id) || t.leadId === user.id).length === 0
                ? <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not assigned to any team</span>
                : teams.filter(t => t.members.includes(user.id) || t.leadId === user.id).map(t => (
                  <span key={t.id} style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e6e8ff', color: '#0010AE', padding: '3px 10px', borderRadius: '6px' }}>
                    {t.name} {t.leadId === user.id ? '(Lead)' : ''}
                  </span>
                ))
              }
            </div>
          </div>

          {/* Projects */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>PROJECTS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {projects.filter(p => p.members.includes(user.id)).length === 0
                ? <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Not assigned to any project</span>
                : projects.filter(p => p.members.includes(user.id)).map(p => (
                  <span key={p.id} style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.color + '22', color: p.color, padding: '3px 10px', borderRadius: '6px', border: `1px solid ${p.color}44` }}>
                    {p.name.split(' (')[0]}
                  </span>
                ))
              }
            </div>
          </div>

          {/* Active Tasks */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Active Tasks</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0010AE' }}>{getUserTasksCount(user.id)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}