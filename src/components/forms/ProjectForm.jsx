import React from 'react';
import MultiSearchSelect from '../ui/MultiSearchSelect';

const COLOR_OPTIONS = ['#8ECAE6', '#FFB5A7', '#FFE3A8', '#B7E4C7', '#C7C7FF', '#F5958E'];

/**
 * ProjectForm — used by both Create and Edit project modals.
 * Props:
 *   formData              { name, color, members[], status, epic, story, release }
 *   onChange              (formData) => void
 *   users                 array of all users
 *   getAdjustedProjectColor (hex, theme) => hex
 *   theme                 current theme string
 */
export default function ProjectForm({ formData, onChange, users, getAdjustedProjectColor, theme }) {
  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Project Name */}
      <div className="form-group">
        <label className="form-label">PROJECT NAME</label>
        <input
          type="text"
          className="input-control"
          placeholder="E.g. Mobile Application V2"
          value={formData.name}
          onChange={e => onChange({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Accent Color */}
      <div className="form-group">
        <label className="form-label">ACCENT COLOR</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {COLOR_OPTIONS.map(c => {
            const adjusted = getAdjustedProjectColor(c, theme);
            const isSelected = getAdjustedProjectColor(formData.color, theme).toLowerCase() === adjusted.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...formData, color: c })}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  backgroundColor: adjusted,
                  border: isSelected ? '2.5px solid var(--text-primary)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
              />
            );
          })}
          {/* Custom hex picker */}
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
            <input
              type="color"
              className="color-picker-wheel"
              value={formData.color}
              onChange={e => onChange({ ...formData, color: e.target.value })}
              style={{ width: '34px', height: '34px', border: 'none', cursor: 'pointer', outline: 'none' }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
              {getAdjustedProjectColor(formData.color, theme).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="form-group">
        <label className="form-label">PROJECT STATUS</label>
        <select
          className="input-control"
          value={formData.status || 'Active'}
          onChange={e => onChange({ ...formData, status: e.target.value })}
          style={{ padding: '0.5rem' }}
        >
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Members */}
      <div className="form-group">
        <label className="form-label">ASSIGN PROJECT MEMBERS</label>
        <MultiSearchSelect
          options={userOptions}
          selectedValues={formData.members || []}
          onChange={vals => onChange({ ...formData, members: vals })}
          placeholder="Search and select project members..."
        />
      </div>

    </div>
  );
}
