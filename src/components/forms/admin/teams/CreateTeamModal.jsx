import React, { useState } from 'react';
import Modal from '../../../ui/Modal';
import SearchableSelect from "../../../ui/SearchableSelect";
import MultiSearchSelect from "../../../ui/MultiSelectDropdown";
/**
 * CreateTeamModal
 * Props:
 *   isOpen    — bool
 *   onClose   — fn
 *   users     — full users array from AppContext
 *   onSubmit  — fn({ name, leadId, members })
 */
export default function CreateTeamModal({ isOpen, onClose, users = [], onSubmit }) {
  const [name, setName] = useState('');
  const [leadId, setLeadId] = useState('');
  const [subLeadId, setSubLeadId] = useState('');
  const [members, setMembers] = useState([]);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !leadId || !subLeadId) {
      alert('Please fill in team name, team lead, and sub lead.');
      return;
    }
    // Auto-include the lead in members if not already there
    const finalMembers = members.includes(leadId) ? members : [leadId, ...members];
    onSubmit({ 
      name: name.trim(), 
      leadId, 
      subLeadId: subLeadId || null,
      members: finalMembers,
      description: description.trim(),
    });
    // Reset form
    setSubLeadId('');
    setDescription('');
    setName('');
    setLeadId('');
    setMembers([]);
  };

  const handleClose = () => {
    setName('');
    setLeadId('');
    setMembers([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="850px">
      <div className="modal-header">
        <h3 className="modal-title">Create New Team</h3>
        <button className="modal-close" onClick={handleClose}>×</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">TEAM NAME</label>
          <input
            type="text"
            className="input-control"
            placeholder="E.g. Engineering Core, Design Team"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">TEAM LEAD</label>
          {/* SingleSearchSelect = one pick, searchable */}
          <SearchableSelect
            options={userOptions}
            value={leadId}
            onChange={(val) => {
              setLeadId(val);
              if (val && !members.includes(val)) {
                setMembers(prev => [...prev, val]);
              }
            }}
            placeholder="Search and select team lead..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">SUB LEAD </label>
          <SearchableSelect
            options={userOptions}
            value={subLeadId}
            onChange={(val) => setSubLeadId(val)}
            placeholder="Search and select sub lead..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">DESCRIPTION </label>
          <textarea
            className="input-control"
            placeholder="What does this team work on?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">TEAM MEMBERS</label>
          {/* MultiSearchSelect = multi pick, searchable */}
          <MultiSearchSelect
            options={userOptions}
            selectedValues={members}
            onChange={setMembers}
            placeholder="Search and select team members..."
          />
          {members.length > 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
              {members.length} selected
            </span>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create Team</button>
        </div>
      </form>
    </Modal>
  );
}