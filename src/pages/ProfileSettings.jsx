import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MessageCircle, Briefcase, Hash,
  Bell, Shield, Palette, Save, Edit2, X, Check,
  Building2, Lock, Eye, EyeOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { dispatchMorningBriefing, dispatchEodReport } from '../services/webhookService';
// ─── tiny helpers ──────────────────────────────────────────────────────────
const NOTIF_OPTIONS = ['ALL', 'IN_APP', 'EMAIL', 'NONE'];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--secondary)',
      }}>
        <Icon size={15} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Editable field ─────────────────────────────────────────────────────────
function Field({ label, value, editing, fieldKey, onChange, type = 'text', readOnly = false, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {editing && !readOnly ? (
        <input
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          className="input-control"
          style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
        />
      ) : (
        <div style={{
          fontSize: '0.85rem',
          color: readOnly ? 'var(--muted-foreground)' : 'var(--foreground)',
          padding: '0.5rem 0.75rem',
          background: readOnly ? 'var(--secondary)' : 'transparent',
          borderRadius: readOnly ? '8px' : 0,
          border: readOnly ? '1px solid var(--border)' : 'none',
          fontStyle: readOnly ? 'italic' : 'normal',
        }}>
          {value || <span style={{ opacity: 0.4 }}>—</span>}
        </div>
      )}
      {hint && editing && (
        <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>{hint}</span>
      )}
    </div>
  );
}

function ChangePasswordBlock({ currentUser, editEmployee, verifyPassword }) {
    const [oldPass, setOldPass]     = useState('');
    const [newPass, setNewPass]     = useState('');
    const [confirmPass, setConfirm] = useState('');
    const [show, setShow]           = useState(false);
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState(false);
  const handleSubmit = () => {
    setError('');
    if (!verifyPassword(currentUser.id, oldPass)) return setError('Current password is incorrect.');
    if (newPass.length < 6)          return setError('New password must be at least 6 characters.');
    if (newPass !== confirmPass)      return setError('Passwords do not match.');
    editEmployee(currentUser.id, { password: newPass });
    setOldPass(''); setNewPass(''); setConfirm('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => {
        const val   = [oldPass, newPass, confirmPass][i];
        const setFn = [setOldPass, setNewPass, setConfirm][i];
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                value={val}
                onChange={(e) => setFn(e.target.value)}
                className="input-control"
                style={{ fontSize: '0.85rem', padding: '0.5rem 2.25rem 0.5rem 0.75rem', width: '100%', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
              <button
                onClick={() => setShow((s) => !s)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', display: 'flex' }}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        );
      })}

      {error && (
        <div style={{ fontSize: '0.78rem', color: '#ef4444', padding: '0.4rem 0.75rem', background: '#ef444410', border: '1px solid #ef444430', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ fontSize: '0.78rem', color: '#22c55e', padding: '0.4rem 0.75rem', background: '#22c55e10', border: '1px solid #22c55e30', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Check size={13} /> Password updated successfully.
        </div>
      )}

      <button
        onClick={handleSubmit}
        style={{
          alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.45rem 1rem', borderRadius: '9px', cursor: 'pointer',
          fontSize: '0.8rem', fontWeight: 650,
          background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none',
        }}
      >
        <Save size={13} /> Update Password
      </button>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function ProfileSettings() {
    const { 
      currentUser, editEmployee, verifyPassword, users, pageZoom, setPageZoom,
      adminSettings = {}, setAdminSettings, tasks = [], timeEntries = [], meetings = [], attendanceHistory = [], timerState = {}, reports = []
    } = useApp();
    const { theme, toggleTheme } = useTheme();

    // Resolve full profile from the employees list — currentUser right after login
    // is a thin auth object (id, email, role only). The users[] array has the real data.
    const profile = users.find(u => 
      String(u.id) === String(currentUser?.id) || 
      (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (u.workEmail && currentUser?.email && u.workEmail.toLowerCase() === currentUser.email.toLowerCase())
    ) || currentUser;

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({});
  const [saved, setSaved]       = useState(false);

  const [dispatchingMorning, setDispatchingMorning] = useState(false);
  const [dispatchingEod, setDispatchingEod] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState(null);

  const handleDispatchMorning = async () => {
    if (!adminSettings.morningWebhookUrl) {
      setWebhookStatus({ type: 'error', message: 'Please specify a Morning Webhook URL first.' });
      return;
    }
    setDispatchingMorning(true);
    setWebhookStatus(null);

    try {
      const TODAY_STR = new Date().toISOString().split('T')[0];
      const staffCount = users.filter(u => u.role !== 'Admin').length;
      
      // Calculate online status
      let onlineCount = 0;
      users.filter(u => u.role !== 'Admin').forEach(u => {
        const att = (attendanceHistory || []).find(a => a.employeeId === u.id && a.date === TODAY_STR);
        if (att && att.clockStatus !== 'Offline') {
          onlineCount++;
        }
      });
      if (currentUser?.role !== 'Admin' && timerState?.isClockedIn) {
        onlineCount++;
      }

      const activeTasksCount = tasks.filter(t => t.status?.toUpperCase() === 'IN_PROGRESS').length;
      
      // Filter upcoming meetings scheduled for today
      const upcomingMeetings = (meetings || []).filter(m => {
        if (!m.scheduledAt) return false;
        const meetDate = new Date(m.scheduledAt).toISOString().split('T')[0];
        return meetDate === TODAY_STR;
      });

      await dispatchMorningBriefing(adminSettings.morningWebhookUrl, {
        staffCount,
        onlineCount,
        activeTasksCount,
        upcomingMeetings
      });

      setWebhookStatus({ type: 'success', message: 'Morning Briefing webhook dispatched successfully.' });
    } catch (error) {
      setWebhookStatus({ type: 'error', message: error.message || 'Dispatch failed.' });
    } finally {
      setDispatchingMorning(false);
    }
  };

  const handleDispatchEod = async () => {
    if (!adminSettings.eodWebhookUrl) {
      setWebhookStatus({ type: 'error', message: 'Please specify an EOD Webhook URL first.' });
      return;
    }
    setDispatchingEod(true);
    setWebhookStatus(null);

    try {
      const TODAY_STR = new Date().toISOString().split('T')[0];
      
      // Total hours logged today
      const todayEntries = (timeEntries || []).filter(e => e.date === TODAY_STR);
      const totalHours = todayEntries.reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);

      // Tasks completed today
      const completedTasksCount = tasks.filter(t => {
        if (t.status?.toUpperCase() !== 'COMPLETED') return false;
        if (t.updatedAt) {
          return t.updatedAt.split('T')[0] === TODAY_STR;
        }
        return false;
      }).length;

      // Pending approvals
      const pendingApprovalsCount = (reports || []).filter(r =>
        r.status === 'Submitted' || r.status?.includes('Pending')
      ).length;

      await dispatchEodReport(adminSettings.eodWebhookUrl, {
        totalHours,
        completedTasksCount,
        pendingApprovalsCount
      });

      setWebhookStatus({ type: 'success', message: 'End-of-Day Report webhook dispatched successfully.' });
    } catch (error) {
      setWebhookStatus({ type: 'error', message: error.message || 'Dispatch failed.' });
    } finally {
      setDispatchingEod(false);
    }
  };

  // Seed form from profile whenever it changes (e.g. after save syncs back)
  useEffect(() => {
    if (profile) {
      setForm({
        name:                    profile.name ?? '',
        email:                   profile.email ?? profile.workEmail ?? '',
        phone:                   profile.phone ?? '',
        whatsapp_number:         profile.whatsapp_number ?? '',
        department:              profile.department ?? '',
        designation:             profile.designation ?? profile.department ?? '',
        notification_preference: profile.notification_preference ?? 'ALL',
        employee_code:           profile.employee_code ?? '',
      });
    }
  }, [profile]);

  if (!currentUser) return null;
  // Show loader if profile still empty (employees haven't loaded yet)
  if (!profile?.name && !profile?.email) return null;

  const handleChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    editEmployee(profile.id, form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setForm({
      name:                    profile.name ?? '',
      email:                   profile.email ?? profile.workEmail ?? '',
      phone:                   profile.phone ?? '',
      whatsapp_number:         profile.whatsapp_number ?? '',
      department:              profile.department ?? '',
      designation:             profile.designation ?? profile.department ?? '',
      notification_preference: profile.notification_preference ?? 'ALL',
      employee_code:           profile.employee_code ?? '',
    });
    setEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1500 }}>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '9px',
            background: 'color-mix(in oklch, var(--primary) 12%, transparent)',
            border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={17} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
              Profile &amp; Settings
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
              Manage your personal details and preferences
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.78rem', fontWeight: 600, color: '#22c55e',
              padding: '0.3rem 0.75rem', borderRadius: '8px',
              background: '#22c55e10', border: '1px solid #22c55e30',
            }}>
              <Check size={13} /> Saved
            </div>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 1rem', borderRadius: '9px', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 650,
                background: 'var(--primary)', color: 'var(--primary-foreground)',
                border: 'none',
              }}
            >
              <Edit2 size={13} /> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 1rem', borderRadius: '9px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 650,
                  background: 'var(--secondary)', color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 1rem', borderRadius: '9px', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 650,
                  background: 'var(--primary)', color: 'var(--primary-foreground)',
                  border: 'none',
                }}
              >
                <Save size={13} /> Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Avatar + identity strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1.5rem',
        padding: '1.5rem',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '14px', flexWrap: 'wrap',
      }}>
        {/* Avatar circle */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'color-mix(in oklch, var(--primary) 14%, transparent)',
          border: '3px solid color-mix(in oklch, var(--primary) 30%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)',
          flexShrink: 0,
        }}>
          {getInitials(profile.name)}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>
            {profile.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: 2 }}>
            {profile.email}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            {/* Role badge */}
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              padding: '2px 10px', borderRadius: '20px',
              background: 'color-mix(in oklch, var(--primary) 12%, transparent)',
              color: 'var(--primary)',
              border: '1px solid color-mix(in oklch, var(--primary) 25%, transparent)',
            }}>
              {profile.role}
            </span>
            {/* Status badge */}
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              padding: '2px 10px', borderRadius: '20px',
              background: profile.status === 'Active' ? '#22c55e12' : '#ef444412',
              color: profile.status === 'Active' ? '#22c55e' : '#ef4444',
              border: `1px solid ${profile.status === 'Active' ? '#22c55e30' : '#ef444430'}`,
            }}>
              {profile.status ?? 'Active'}
            </span>
            {/* Department */}
            {profile.department && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600,
                padding: '2px 10px', borderRadius: '20px',
                background: 'var(--secondary)', color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}>
                {profile.department}
              </span>
            )}
          </div>
        </div>

        {/* Employee code — always read-only */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Employee Code
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-mono, monospace)', marginTop: 2 }}>
            {profile.employee_code ?? '—'}
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="settings-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <Field label="Full Name"   value={form.name}  editing={editing} fieldKey="name"  onChange={handleChange} />
            <Field label="Email"       value={form.email} editing={editing} fieldKey="email" onChange={handleChange} type="email"
              hint="Changing email will update your login address." />
            <Field label="Phone Number"    value={form.phone}           editing={editing} fieldKey="phone"           onChange={handleChange} type="tel" />
            <Field label="WhatsApp Number" value={form.whatsapp_number} editing={editing} fieldKey="whatsapp_number" onChange={handleChange} type="tel" />
          </Section>
          {/* ── Change Password ── */}
            <Section title="Change Password" icon={Lock}>
                <ChangePasswordBlock currentUser={profile} editEmployee={editEmployee} verifyPassword={verifyPassword} />
                </Section>

        </div>

        {/* Right col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Work Info */}
          <Section title="Work Information" icon={Briefcase}>
            <Field label="Department"   value={form.department}   editing={editing} fieldKey="department"   onChange={handleChange} />
            <Field label="Designation"  value={form.designation}  editing={editing} fieldKey="designation"  onChange={handleChange} />
            <Field label="Role"         value={profile.role}  editing={false}   fieldKey="role"         onChange={handleChange} readOnly hint="Role is managed by admin." />
            <Field label="Employee Code" value={profile.employee_code} editing={false} fieldKey="employee_code" onChange={handleChange} readOnly />
          </Section>

          {/* Preferences */}
          <Section title="Preferences" icon={Bell}>
            {/* Notification preference */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Notification Preference
              </label>
              
              {editing ? (
                <select
                  value={form.notification_preference}
                  onChange={(e) => handleChange('notification_preference', e.target.value)}
                  className="input-control"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                >
                  {NOTIF_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', padding: '0.5rem 0' }}>
                  {form.notification_preference}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Auto Clockin 
              </label>
              <label>
                Yes
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Show Activity Status 
              </label>
              <label>
                Yes 
              </label>
            </div>

            {/* Page Zoom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Page Zoom
                </label>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>
                  {Math.round(pageZoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={pageZoom}
                onChange={(e) => setPageZoom(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--border)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Theme toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Appearance
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--foreground)', marginTop: 2 }}>
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 650,
                  background: 'var(--secondary)', color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                <Palette size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                Toggle
              </button>
            </div>
          </Section>

        </div>
      </div>

      {/* ── Admin Settings Section ── */}
      {currentUser?.role === 'Admin' && (
        <div style={{ marginTop: '0.5rem' }}>
          <Section title="Administration Controls & Integrations" icon={Shield}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Policy & Time settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>Policies &amp; Thresholds</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Missing Timesheet Policy
                  </label>
                  <select
                    value={adminSettings.missingTimesheetPolicy || 'LOP'}
                    onChange={(e) => setAdminSettings(prev => ({ ...prev, missingTimesheetPolicy: e.target.value }))}
                    className="input-control"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                  >
                    <option value="LOP">LOP (Loss of Pay)</option>
                    <option value="Leave">Leave Deduction</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Late Clock-In Time Limit
                  </label>
                  <input
                    type="time"
                    value={adminSettings.lateClockInTime || '10:00'}
                    onChange={(e) => setAdminSettings(prev => ({ ...prev, lateClockInTime: e.target.value }))}
                    className="input-control"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              {/* Webhooks configuration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--foreground)' }}>Microsoft Teams Integration Webhooks</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Morning Briefing Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://outlook.office.com/webhook/..."
                    value={adminSettings.morningWebhookUrl || ''}
                    onChange={(e) => setAdminSettings(prev => ({ ...prev, morningWebhookUrl: e.target.value }))}
                    className="input-control"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    End-of-Day Report Webhook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://outlook.office.com/webhook/..."
                    value={adminSettings.eodWebhookUrl || ''}
                    onChange={(e) => setAdminSettings(prev => ({ ...prev, eodWebhookUrl: e.target.value }))}
                    className="input-control"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>
            </div>

            {/* Warning and Action Buttons */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--muted-foreground)',
                padding: '0.75rem 1rem',
                background: 'color-mix(in oklch, var(--primary) 6%, transparent)',
                border: '1px solid color-mix(in oklch, var(--primary) 15%, transparent)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>⚠️ Webhook Orchestration Note</span>
                <span>Production report schedules should run on the Spring Boot backend server. Client-side dispatch is provided for verification and on-demand testing. Webhook endpoints must support CORS or be tested from a browser environment with relaxed security.</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDispatchMorning}
                  disabled={dispatchingMorning}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 650,
                    background: '#0010AE', color: '#ffffff', border: 'none',
                    opacity: dispatchingMorning ? 0.7 : 1
                  }}
                >
                  {dispatchingMorning ? 'Dispatching...' : 'Dispatch Morning Briefing (Test)'}
                </button>

                <button
                  type="button"
                  onClick={handleDispatchEod}
                  disabled={dispatchingEod}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 650,
                    background: '#0010AE', color: '#ffffff', border: 'none',
                    opacity: dispatchingEod ? 0.7 : 1
                  }}
                >
                  {dispatchingEod ? 'Dispatching...' : 'Dispatch End-of-Day Report (Test)'}
                </button>
              </div>

              {webhookStatus && (
                <div style={{
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  backgroundColor: webhookStatus.type === 'success' ? '#22c55e10' : '#ef444410',
                  color: webhookStatus.type === 'success' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${webhookStatus.type === 'success' ? '#22c55e30' : '#ef444430'}`
                }}>
                  {webhookStatus.message}
                </div>
              )}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}