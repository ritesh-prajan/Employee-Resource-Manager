import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../../ui/Modal';
import SearchableSelect from "../../../ui/SearchableSelect";
import MultiSearchSelect from "../../../ui/MultiSelectDropdown";
import { useToast } from '../../../../context/ToastContext';
import { useMsTeamsGroups, useMsTeamsChannels } from '../../../../hooks/useMsTeams';

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

  // Sync form fields whenever the team prop changes (different row clicked)
  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setLeadId(team.leadId || '');
      setSubLeadId(team.subLeadId || '');
      setMembers(team.members || []);
      setDescription(team.description || '');
      setTeamsGroupId(team.teamsGroupId || '');
      setTeamsChannelId(team.teamsChannelId || '');
    }
  }, [team]);

  // Build channel options with graceful fallback for unknown/legacy channel IDs
  const channelOptions = useMemo(() => {
    const fetched = (channelsData || []).map(c => ({ value: c.id, label: c.displayName }));

    // If editing a team with a stored channelId that doesn't match any fetched option,
    // show the raw ID as a fallback so the admin can see what was previously set
    if (
      teamsChannelId &&
      !channelsLoading &&
      !channelsError &&
      fetched.length > 0 &&
      !fetched.some(o => o.value === teamsChannelId)
    ) {
      fetched.unshift({
        value: teamsChannelId,
        label: `Unknown channel (raw ID: ${teamsChannelId.substring(0, 30)}${teamsChannelId.length > 30 ? '…' : ''})`,
      });
    }

    return fetched;
  }, [channelsData, channelsLoading, channelsError, teamsChannelId]);

  if (!isOpen || !team) return null;

  const userOptions = users.map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  const groupOptions = (groupsData || []).map(g => ({ value: g.id, label: g.displayName }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !leadId) {
      toast.warning('Please fill in team name and select a lead.');
      return;
    }
    if (!teamsGroupId || !teamsChannelId) {
      toast.warning('Please select a Microsoft Team and Channel.');
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
        teamsGroupId,
        teamsChannelId,
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