import React from 'react';

export default function ViewProfileModal({ show, onClose, user, users, teams, projects }) {
  if (!show || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '850px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem 2rem'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {(() => {
              if (user.avatar) {
                return (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--border-color)',
                      marginRight: '0.75rem',
                      flexShrink: 0
                    }}
                  />
                );
              }
              const parts = user.name.trim().split(/\s+/);
              const initials = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : parts[0].substring(0, 2).toUpperCase();
              return (
                <div
                  className="user-initials-badge"
                  style={{
                    width: '52px',
                    height: '52px',
                    fontSize: '1.1rem',
                    border: '2px solid var(--border-color)',
                    marginRight: '0.75rem',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-canvas, #f6f6f6)',
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}
                >
                  {initials}
                </div>
              );
            })()}
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                {user.name}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '2px' }}>
                <span className="user-role-badge" style={{ fontSize: '0.68rem', margin: 0 }}>{user.role}</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: user.status === 'Active'
                    ? 'var(--color-success, #10b981)'
                    : user.status === 'On Break'
                    ? 'var(--color-warning, #f59e0b)'
                    : 'var(--text-muted)'
                }}>
                  {user.status}
                </span>
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            style={{ fontSize: '1.5rem', padding: '4px', cursor: 'pointer', border: 'none', background: 'none' }}
          >
            ×
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Profile Details Grid */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Employee Profile
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--bg-canvas, #f6f6f6)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem'
              
            }}>
              {[
                
                { label: 'EMPLOYEE NUMBER', value: user.employee_code || '-', mono: true },
                { label: 'DESIGNATION', value: user.designation || user.department || 'General' },
                { label: 'WORK EMAIL', value: user.email, isEmail: true, emailHref: `mailto:${user.email}`, emailStyle: { color: 'var(--pastel-blue, #0010AE)' } },
                { label: 'PERSONAL EMAIL', value: user.personalEmail || null, isEmail: !!user.personalEmail, emailHref: user.personalEmail ? `mailto:${user.personalEmail}` : null },
                { label: 'PHONE NUMBER', value: user.phone || '-' },
                { label: 'PASSWORD LAST UPDATED', value: user.passwordLastUpdated ? new Date(user.passwordLastUpdated).toLocaleString() : 'Never', small: true },
              ].map(({ label, value, mono, isEmail, emailHref, emailStyle, small }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>{label}</span>
                  {isEmail && emailHref ? (
                    <a href={emailHref} style={{ fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)', ...emailStyle }}>
                      {value}
                    </a>
                  ) : (
                    <span style={{
                      fontSize: small ? '0.82rem' : '0.85rem',
                      fontWeight: small ? 400 : (mono ? 600 : 500),
                      color: small ? 'var(--text-secondary)' : 'var(--text-primary)',
                      fontFamily: mono ? 'var(--font-mono, monospace)' : undefined
                    }}>
                      {value ?? '-'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Memberships Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

            {/* Teams Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Team Membership
              </h4>
              {(() => {
                const uid = Number(user.id);
                const userTeams = teams.filter(t =>
                  t.members.some(mId => Number(mId) === uid) || Number(t.leadId) === uid
                );
                if (userTeams.length === 0) {
                  return <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Not assigned to any teams</span>;
                }
                return userTeams.map(t => {
                  const isLead = t.leadId === user.id;
                  const teamLeadUser = users.find(u => u.id === t.leadId);
                  return (
                    <div key={t.id} style={{
                      backgroundColor: 'var(--bg-canvas, #f6f6f6)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{t.name}</span>
                        {isLead && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(0, 16, 174, 0.1)',
                            color: '#0010AE',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            Lead
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Lead: </span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {isLead ? 'Self' : (teamLeadUser ? teamLeadUser.name : 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Members ({t.members.length}):</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {t.members.map(mId => {
                              const mUser = users.find(u => Number(u.id) === Number(mId));
                              if (!mUser) return null;
                              const isCurrent = mUser.id === user.id;
                              return (
                                <span key={mId} style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: isCurrent ? 'rgba(0, 16, 174, 0.05)' : 'var(--bg-surface)',
                                  border: '1px solid var(--border-color)',
                                  color: isCurrent ? '#0010AE' : 'var(--text-primary)',
                                  fontWeight: isCurrent ? 600 : 400
                                }}>
                                  {mUser.name} {mUser.id === t.leadId ? '👑' : ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Projects Block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Assigned Projects
              </h4>
              {(() => {
                const uid = Number(user.id);
                const userProjects = projects.filter(p =>
                  p.members.some(mId => Number(mId) === uid)
                );
                if (userProjects.length === 0) {
                  return <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Not assigned to any projects</span>;
                }
                return userProjects.map(p => (
                  <div key={p.id} style={{
                    backgroundColor: 'var(--bg-canvas, #f6f6f6)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${p.color || '#0010AE'}`,
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{p.name || p.projectName || 'Unnamed Project'}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: p.status === 'Active' ? 'var(--color-success)' : 'var(--text-muted)'
                      }}>
                        {p.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Client: </span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.client}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Members ({p.members.length}):</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {p.members.map(mId => {
                            const mUser = users.find(u => Number(u.id) === Number(mId));
                            if (!mUser) return null;
                            const isCurrent = Number(mUser.id) === Number(user.id);
                            return (
                              <span key={mId} style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: isCurrent ? 'rgba(0, 16, 174, 0.05)' : 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                color: isCurrent ? '#0010AE' : 'var(--text-primary)',
                                fontWeight: isCurrent ? 600 : 400
                              }}>
                                {mUser.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.25rem', marginBottom: 0, flexShrink: 0 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '0.55rem 1.5rem', borderRadius: '9999px', fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}