import React, { useState, useEffect } from 'react';
import Modal from "../../../../components/ui/Modal";
import MultiSearchSelect from "../../../../components/ui/MultiSelectDropdown";
import { useApp } from "../../../../context/AppContext";

export default function EditProjectModal({ show, onClose, project }) {
  const { users, teams, editProject, getAdjustedProjectColor, theme } = useApp();

  const [projData, setProjData] = useState(null);

  const colorOptions = ['#8ECAE6', '#FFB5A7', '#FFE3A8', '#B7E4C7', '#C7C7FF', '#F5958E'];

  useEffect(() => {
    if (project) {
      setProjData({
        name: project.name || '',
        color: project.color || '#8ECAE6',
        status: project.status || 'Active',
        members: project.members || [],
      });
    }
  }, [project]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projData.name) { alert('Please fill in project name.'); return; }
    if (!projData.members.length) { alert('Please assign at least one member.'); return; }

    const autoTeams = new Set();
    projData.members.forEach(memberId => {
      teams.forEach(team => {
        if (team.leadId === memberId || team.members.includes(memberId)) {
          autoTeams.add(team.id);
        }
      });
    });

    editProject(project.id, {
      name: projData.name,
      color: projData.color,
      status: projData.status,
      members: projData.members,
      teams: Array.from(autoTeams),
    });
    onClose();
  };

  if (!projData) return null;

  return (
    <Modal isOpen={show} onClose={onClose} maxWidth="460px">
      <div className="modal-header">
        <h3 className="modal-title">Edit Project</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">PROJECT NAME</label>
          <input
            type="text"
            className="input-control"
            placeholder="E.g. Mobile Application V2"
            value={projData.name}
            onChange={(e) => setProjData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">ACCENT COLOR</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {colorOptions.map(c => {
              const adjusted = getAdjustedProjectColor(c, theme);
              const isSelected = getAdjustedProjectColor(projData.color, theme).toLowerCase() === adjusted.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProjData(prev => ({ ...prev, color: c }))}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: adjusted,
                    border: isSelected ? '2.5px solid #1e293b' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                />
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '1rem' }}>
              <input
                type="color"
                value={projData.color}
                onChange={(e) => setProjData(prev => ({ ...prev, color: e.target.value }))}
                style={{ width: '34px', height: '34px', border: 'none', cursor: 'pointer', outline: 'none' }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginLeft: '8px', fontFamily: 'monospace' }}>
                {projData.color.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">PROJECT STATUS</label>
          <select
            className="input-control"
            value={projData.status}
            onChange={(e) => setProjData(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">ASSIGN PROJECT MEMBERS</label>
          <MultiSearchSelect
            options={users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))}
            selectedValues={projData.members}
            onChange={(vals) => setProjData(prev => ({ ...prev, members: vals }))}
            placeholder="Search and select members..."
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}