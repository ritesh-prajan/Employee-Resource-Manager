import React, { useState, useEffect } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import MultiSearchSelect from '../../../ui/MultiSelectDropdown';

export default function EditEmployeeModal({ show, onClose, user, users, teams, projects, onSubmit }) {
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const teamOptions = teams.map(t => ({ value: t.id, label: t.name }));
  const projectOptions = projects.map(p => ({ value: p.id, label: p.name, color: p.color }));

  useEffect(() => {
    if (user) {
      setEditingUser({
        ...user,
        designation: user.designation || '',
        personalEmail: user.personalEmail || '',
        phone: user.phone || '',
        password: user.password || '',
        teams: teams.filter(t => t.members.includes(user.id)).map(t => t.id),
        projects: projects.filter(p => p.members.includes(user.id)).map(p => p.id),
      });
    }
  }, [user]);

  const handleGeneratePassword = () => {
    const chars = '0123456789ABCDEF';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * 16)];
    setEditingUser(prev => ({ ...prev, password: pass }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    const empCodeTrimmed = editingUser.employee_code.trim();
    const emailTrimmed = editingUser.email.trim();
    const phoneTrimmed = editingUser.phone.trim();
    if (!editingUser.name || !empCodeTrimmed || !emailTrimmed || !phoneTrimmed) {
      setValidationError('Please fill in all required fields.'); return;
    }
    if (users.some(u => u.id !== editingUser.id && u.employee_code?.trim().toLowerCase() === empCodeTrimmed.toLowerCase())) {
      setValidationError('Employee number must be unique.'); return;
    }
    if (users.some(u => u.id !== editingUser.id && u.email.trim().toLowerCase() === emailTrimmed.toLowerCase())) {
      setValidationError('Work email must be unique.'); return;
    }
    if (users.some(u => u.id !== editingUser.id && u.phone && u.phone.trim().replace(/\s+/g, '') === phoneTrimmed.replace(/\s+/g, ''))) {
      setValidationError('Phone number must be unique.'); return;
    }
    const oldUser = users.find(u => u.id === editingUser.id);
    onSubmit(editingUser.id, {
      name: editingUser.name,
      employee_code: empCodeTrimmed,
      email: emailTrimmed,
      personalEmail: editingUser.personalEmail.trim(),
      phone: phoneTrimmed,
      password: editingUser.password,
      passwordLastUpdated: oldUser?.password !== editingUser.password ? new Date().toISOString() : (oldUser?.passwordLastUpdated || ''),
      designation: editingUser.designation.trim() || 'General',
      role: editingUser.role,
      status: editingUser.status,
      teams: editingUser.teams,
      projects: editingUser.projects
    });
    setShowPassword(false);
    setValidationError('');
    onClose();
  };

  if (!show || !editingUser) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth:'850px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Staff Member</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {validationError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 500 }}>
              <ShieldAlert size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">FULL NAME *</label>
              <input type="text" className="input-control" placeholder="E.g. David Miller" value={editingUser.name} onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">EMPLOYEE NUMBER *</label>
              <input type="text" className="input-control" placeholder="E.g. EMP-0046" value={editingUser.employee_code || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, employee_code: e.target.value }))} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">WORK EMAIL *</label>
              <input type="email" className="input-control" placeholder="E.g. david.m@office.com" value={editingUser.email} onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">PERSONAL EMAIL (OPTIONAL)</label>
              <input type="email" className="input-control" placeholder="E.g. david.m.personal@gmail.com" value={editingUser.personalEmail || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, personalEmail: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">PHONE NUMBER *</label>
              <input type="text" className="input-control" placeholder="E.g. +91 99999 88888" value={editingUser.phone || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">DESIGNATION *</label>
              <input type="text" className="input-control" placeholder="E.g. Senior Software Engineer" value={editingUser.designation || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, designation: e.target.value }))} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ORGANIZATIONAL ROLE</label>
              <select className="input-control" value={editingUser.role} onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}>
                <option value="Employee">Employee</option>
                <option value="Sub Lead">Sub Team Lead</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">STATUS</label>
              <select className="input-control" value={editingUser.status} onChange={(e) => setEditingUser(prev => ({ ...prev, status: e.target.value }))}>
                <option value="Active">Active</option>
                <option value="On Break">On Break</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">PASSWORD</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type={showPassword ? 'text' : 'password'} className="input-control" placeholder="Enter or generate password" value={editingUser.password || ''} onChange={(e) => setEditingUser(prev => ({ ...prev, password: e.target.value }))} style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={handleGeneratePassword} style={{ whiteSpace: 'nowrap', padding: '0.55rem 0.85rem', fontSize: '0.8rem' }}>Generate</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">PASSWORD LAST UPDATED</label>
              <div style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-canvas, #f6f6f6)', fontSize: '0.82rem', color: 'var(--text-secondary)', minHeight: '38px', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
                {editingUser.passwordLastUpdated ? new Date(editingUser.passwordLastUpdated).toLocaleString() : 'Never'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">ASSIGN TEAMS</label>
              <MultiSearchSelect options={teamOptions} selectedValues={editingUser.teams || []} onChange={(vals) => setEditingUser(prev => ({ ...prev, teams: vals }))} placeholder="Select teams..." />
            </div>
            <div className="form-group">
              <label className="form-label">ASSIGN PROJECTS</label>
              <MultiSearchSelect options={projectOptions} selectedValues={editingUser.projects || []} onChange={(vals) => setEditingUser(prev => ({ ...prev, projects: vals }))} placeholder="Select projects..." />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0010AE', color: '#ffffff' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}