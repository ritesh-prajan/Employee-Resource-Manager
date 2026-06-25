import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../../ui/Modal';
import SearchableSelect from '../../../ui/SearchableSelect';
import { useToast } from '../../../../context/ToastContext';

export default function ReassignLeadModal({ show, onClose, employee, teams, users, onSave }) {
  const toast = useToast();
  // Find all teams where this employee is lead or sublead
  const affectedTeams = teams.filter(
    t => String(t.leadId) === String(employee?.id) || String(t.subLeadId) === String(employee?.id)
  );

  const [assignments, setAssignments] = useState(() =>
    Object.fromEntries(affectedTeams.map(t => [t.id, { leadId: t.leadId, subLeadId: t.subLeadId }]))
  );
  const [saving, setSaving] = useState(false);

  if (!show || !employee) return null;

  // Exclude the employee being deleted from options
  const userOptions = users
    .filter(u => String(u.id) !== String(employee.id))
    .map(u => ({ value: u.id, label: `${u.name} (${u.role})` }));

  const handleSave = async () => {
    // Validate — every team must still have a lead
    for (const team of affectedTeams) {
      if (!assignments[team.id]?.leadId) {
        toast.warning(`Please assign a new lead for "${team.name}" before continuing.`);
        return;
      }
    }
    setSaving(true);
    await onSave(assignments); // parent handles the actual API calls then deletes
    setSaving(false);
  };

  return (
    <Modal isOpen={show} onClose={onClose} maxWidth="560px">
      <div className="modal-header">
        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#f59e0b" />
          Cannot Delete — Lead Reassignment Required
        </h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <p style={{ fontSize: '0.83rem', color: 'var(--muted-foreground)', margin: '1rem 0 1.25rem' }}>
        <strong>{employee.name}</strong> is a lead or sub lead in the following teams. Reassign before deleting.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {affectedTeams.map(team => (
          <div key={team.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {team.name}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">TEAM LEAD *</label>
                <SearchableSelect
                  options={userOptions}
                  value={assignments[team.id]?.leadId || ''}
                  onChange={val => setAssignments(prev => ({
                    ...prev,
                    [team.id]: { ...prev[team.id], leadId: val }
                  }))}
                  placeholder="Select new lead..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">SUB LEAD (OPTIONAL)</label>
                <SearchableSelect
                  options={userOptions}
                  value={assignments[team.id]?.subLeadId || ''}
                  onChange={val => setAssignments(prev => ({
                    ...prev,
                    [team.id]: { ...prev[team.id], subLeadId: val }
                  }))}
                  placeholder="Select sub lead..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save & Delete Employee'}
        </button>
      </div>
    </Modal>
  );
}