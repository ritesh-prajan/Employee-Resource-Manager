import React, { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import SearchableSelect from "../../../ui/SearchableSelect";
import MultiSearchSelect from "../../../ui/MultiSelectDropdown";

/**
 * EditTeamModal
 * Props:
 *   isOpen   — bool
 *   onClose  — fn
 *   team     — the team object being edited { id, name, leadId, members }
 *   users    — full users array from AppContext
 *   onSave   — fn(teamId, { name, leadId, members })
 */
export default function EditTeamModal({ isOpen, onClose, team, users = [], onSave }) {
    const [name, setName] = useState('');
    const [leadId, setLeadId] = useState('');
    const [subLeadId, setSubLeadId] = useState('');
    const [members, setMembers] = useState([]);
    const [description, setDescription] = useState('');

  // Sync form fields whenever the team prop changes (different row clicked)
  useEffect(() => {
  if (team) {
      setName(team.name || '');
      setLeadId(team.leadId || '');
      setSubLeadId(team.subLeadId || '');
      setMembers(team.members || []);
      setDescription(team.description || '');
    }
if (team) {
      setName(team.name || '');
      setLeadId(team.leadId || '');
      setMembers(team.members || []);
    }
  }, [team]);

  if (!isOpen || !team) return null;

  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !leadId) {
      alert('Please fill in team name and select a lead.');
      return;
    }
    let finalMembers = members.includes(leadId) ? members : [leadId, ...members];
    if (subLeadId && !finalMembers.includes(subLeadId)) {
      finalMembers = [subLeadId, ...finalMembers];
    }
      onSave(team.id, { 
        name: name.trim(), 
        leadId,
        subLeadId: subLeadId || null,
        members: finalMembers,
        description: description.trim(),
      });
      onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="850px" overflow="visible">
      <div className="modal-header">
        <h3 className="modal-title">Edit Team</h3>
        <button className="modal-close" onClick={onClose}>×</button>
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
          <label className="form-label">SUB LEAD (OPTIONAL)</label>
          <SearchableSelect
            options={userOptions}
            value={subLeadId}
            onChange={(val) => setSubLeadId(val)}
            placeholder="Search and select sub lead..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">DESCRIPTION (OPTIONAL)</label>
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
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}