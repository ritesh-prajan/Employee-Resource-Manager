import React from 'react';
import SingleSearchSelect from '../ui/SearchableSelect';
import MultiSearchSelect from '../ui/MultiSelectDropdown';

/**
 * TeamForm — used by both Create and Edit team modals.
 * Props:
 *   formData   { name, leadId, members[] }
 *   onChange   (formData) => void
 *   users      array of all users
 *   hideLeadField  bool — Team Lead role can't change their own lead
 */
export default function TeamForm({ formData, onChange, users, hideLeadField = false }) {
  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Team Name */}
      <div className="form-group">
        <label className="form-label">TEAM NAME</label>
        <input
          type="text"
          className="input-control"
          placeholder="E.g. Engineering Core, Design Team"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Team Lead */}
      {!hideLeadField && (
        <div className="form-group">
          <label className="form-label">TEAM LEAD</label>
          <SingleSearchSelect
            options={userOptions}
            value={formData.leadId}
            onChange={selectedLeadId => {
              const newMembers = [...formData.members];
              if (selectedLeadId && !newMembers.includes(selectedLeadId)) {
                newMembers.push(selectedLeadId);
              }
              onChange({ ...formData, leadId: selectedLeadId, members: newMembers });
            }}
            placeholder="Search and select team lead..."
          />
        </div>
      )}

      {/* Team Members */}
      <div className="form-group">
        <label className="form-label">TEAM MEMBERS</label>
        <MultiSearchSelect
          options={userOptions}
          selectedValues={formData.members}
          onChange={vals => onChange({ ...formData, members: vals })}
          placeholder="Search and select team members..."
        />
      </div>

    </div>
  );
}
