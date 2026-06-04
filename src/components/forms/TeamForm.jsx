import React from 'react';

export default function TeamForm({ formData, onChange, users }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Team Name */}
      <div className="form-group">
        <label className="form-label">TEAM NAME</label>
        <input
          type="text"
          className="input-control"
          placeholder="E.g. Engineering Core"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Team Lead */}
      <div className="form-group">
        <label className="form-label">TEAM LEAD</label>
        <select
          className="input-control"
          value={formData.leadId}
          onChange={(e) => onChange({ ...formData, leadId: e.target.value })}
        >
          <option value="">Select a lead...</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
          ))}
        </select>
      </div>

      {/* Team Members */}
      <div className="form-group">
        <label className="form-label">TEAM MEMBERS</label>
        <select
          multiple
          className="input-control"
          value={formData.members}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(o => o.value);
            onChange({ ...formData, members: selected });
          }}
          style={{ height: '120px' }}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
          ))}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Hold Ctrl/Cmd to select multiple
        </span>
      </div>

    </div>
  );
}