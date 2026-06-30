import React, { useState } from 'react';
import Modal from '../../../ui/Modal';
import SearchableSelect from "../../../ui/SearchableSelect";
import MultiSearchSelect from "../../../ui/MultiSelectDropdown";
import { useToast } from '../../../../context/ToastContext';
import { useMsTeamsGroups, useMsTeamsChannels } from '../../../../hooks/useMsTeams';
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
  const [teamsGroupId, setTeamsGroupId] = useState('');
  const [teamsChannelId, setTeamsChannelId] = useState('');
  const toast = useToast();

  // Live Microsoft Teams dropdowns
  const {
    data: groupsData,
    isLoading: groupsLoading,
    isError: groupsError,
    refetch: refetchGroups,
  } = useMsTeamsGroups({ enabled: isOpen });

  const {
    data: channelsData,
    isLoading: channelsLoading,
    isError: channelsError,
    refetch: refetchChannels,
  } = useMsTeamsChannels(teamsGroupId, { enabled: isOpen && !!teamsGroupId });

  if (!isOpen) return null;

  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  const groupOptions = (groupsData || []).map(g => ({ value: g.id, label: g.displayName }));
  const channelOptions = (channelsData || []).map(c => ({ value: c.id, label: c.displayName }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !leadId) {
      toast.warning('Please fill in team name and select a team lead.');
      return;
    }
    if (!teamsGroupId || !teamsChannelId) {
      toast.warning('Please select a Microsoft Team and Channel.');
      return;
    }
    // Auto-include the lead in members if not already there
    let finalMembers = members.includes(leadId) ? members : [leadId, ...members];
    if (subLeadId && !finalMembers.includes(subLeadId)) {
      finalMembers = [subLeadId, ...finalMembers];
    }  
  onSubmit({ 
      name: name.trim(), 
      leadId, 
      subLeadId: subLeadId || null,
      members: finalMembers,
      description: description.trim(),
      teamsGroupId,
      teamsChannelId,
    });
    // Reset form
    setSubLeadId('');
    setDescription('');
    setTeamsGroupId('');
    setTeamsChannelId('');
    setName('');
    setLeadId('');
    setMembers([]);
  };

  const handleClose = () => {
    setName('');
    setLeadId('');
    setMembers([]);
    setTeamsGroupId('');
    setTeamsChannelId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="850px" overflow="visible">
      <div className="modal-header" style={{ marginBottom: '1rem' }}>
        <h3 className="modal-title">Create New Team</h3>
        <button className="modal-close" onClick={handleClose}>×</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', maxH: 'calc(90vh - 80px)' }}>
        <div style={{ flex: 1, overflowY: 'visible', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '1rem' }}>
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
              onChange={(val) => {
                setSubLeadId(val);
                if (val && !members.includes(val)) {
                  setMembers(prev => [...prev, val]);
                }
              }}
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

          {/* Microsoft Teams integration dropdowns */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">MICROSOFT TEAM</label>
              {groupsError ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)', fontSize: '0.8rem', color: '#ef4444' }}>
                  <span>Couldn't load Microsoft Teams</span>
                  <button
                    type="button"
                    onClick={() => refetchGroups()}
                    style={{ background: 'none', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px', fontWeight: 600 }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={groupOptions}
                  value={teamsGroupId}
                  onChange={(val) => {
                    setTeamsGroupId(val);
                    setTeamsChannelId(''); // reset channel when group changes
                  }}
                  placeholder={groupsLoading ? 'Loading teams...' : 'Select a Microsoft Team...'}
                  disabled={groupsLoading}
                />
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">CHANNEL</label>
              {channelsError && teamsGroupId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)', fontSize: '0.8rem', color: '#ef4444' }}>
                  <span>Couldn't load channels</span>
                  <button
                    type="button"
                    onClick={() => refetchChannels()}
                    style={{ background: 'none', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px', fontWeight: 600 }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <SearchableSelect
                  options={channelOptions}
                  value={teamsChannelId}
                  onChange={setTeamsChannelId}
                  placeholder={!teamsGroupId ? 'Select a team first' : channelsLoading ? 'Loading channels...' : 'Select a channel...'}
                  disabled={!teamsGroupId || channelsLoading}
                />
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '40px' }}>
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
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Create Team</button>
        </div>
      </form>
    </Modal>
  );
}