import React, { useState } from 'react';
import Modal from "../../../../components/ui/Modal";
import MultiSearchSelect from "../../../../components/ui/MultiSelectDropdown";
import { useApp } from "../../../../context/AppContext";
import { useToast } from "../../../../components/ui/Toast";

export default function CreateProjectModal({ show, onClose }) {
  const { users, teams, createProject, getAdjustedProjectColor, theme } = useApp();
  const toast = useToast();

  const [projData, setProjData] = useState({
    name: '', color: '#8ECAE6', members: [], status: 'Active',
    client: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const colorOptions = ['#8ECAE6', '#FFB5A7', '#FFE3A8', '#B7E4C7', '#C7C7FF', '#F5958E'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projData.name) { toast.warning('Please fill in project name.'); return; }
    if (!projData.members.length) { toast.warning('Please assign at least one member.'); return; }

    const autoTeams = new Set();
    projData.members.forEach(memberId => {
      teams.forEach(team => {
        if (team.leadId === memberId || team.members.includes(memberId)) {
          autoTeams.add(team.id);
        }
      });
    });
    createProject({
      ...projData,
      client: projData.client || 'Internal',
      startDate: projData.startDate,
      endDate: projData.endDate || null,
      teams: Array.from(autoTeams),
    });
    setProjData({ name: '', color: '#8ECAE6', members: [], status: 'Active' });
    onClose();
  };

  return (
    <Modal isOpen={show} onClose={onClose} maxWidth="850px">
      <div className="modal-header">
        <h3 className="modal-title">Create New Project</h3>
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
          <label className="form-label">CLIENT NAME</label>
          <input
            type="text"
            className="input-control"
            placeholder="E.g. Acme Corp"
            value={projData.client}
            onChange={(e) => setProjData(prev => ({ ...prev, client: e.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">START DATE</label>
            <input
              type="date"
              className="input-control"
              value={projData.startDate}
              onChange={(e) => setProjData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">END DATE</label>
            <input
              type="date"
              className="input-control"
              value={projData.endDate}
              onChange={(e) => setProjData(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
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
          <button type="submit" className="btn btn-primary">Create Project</button>
        </div>
      </form>
    </Modal>
  );
}