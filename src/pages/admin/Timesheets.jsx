import React, { useState, useMemo } from 'react';
import { Layers, Filter, Activity, ShieldCheck, Fingerprint, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ModernDailyTimesheets from '../../components/timesheets/ModernDailyTimesheets';
import ClassicTimesheets from '../../components/timesheets/ClassicTimesheets';
import TreeTimesheets from '../../components/timesheets/TreeTimesheets';

function ComplianceConsole() {
  const { users, timeEntries, adminSettings } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchQuery, setSearchQuery] = useState('');

  // Check if selectedDate is weekend
  const d = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

  // Filter users who are active/employees (non-Admin)
  const staff = users.filter(u => u.role !== 'Admin' && u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Calculate stats for selectedMonth (Item 13)
  const uniqueLoggedDates = useMemo(() => {
    const monthLogs = timeEntries.filter(e => e.date.startsWith(selectedMonth));
    return new Set(monthLogs.map(e => e.date)).size;
  }, [timeEntries, selectedMonth]);

  const policy = adminSettings?.missingTimesheetPolicy || 'LOP';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Metrics Header Card (Item 13 & 1 & 2) */}
      <div className="lead-dashboard-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Compliance Policy</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>Auto-Flag: {policy}</p>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>Missing working day logs auto-flagged as {policy}</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Working Days Logged</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{uniqueLoggedDates} Days</p>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>Unique logged dates for {selectedMonth}</span>
        </div>
        <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: 0, fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Active Staff Tracked</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>{staff.length} Staff</p>
          <span style={{ fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>Monitoring check-ins and log completion</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Check Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Month Summary</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)', cursor: 'pointer' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '220px' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: 750, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Search Staff</label>
          <input
            type="text"
            placeholder="Search name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'var(--foreground)' }}
          />
        </div>
      </div>

      {/* Grid listing */}
      <div style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Employee</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Hours (Selected Day)</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Compliance Status</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Month Logged Days</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(u => {
              const dayLogs = timeEntries.filter(e => String(e.userId) === String(u.id) && e.date === selectedDate);
              const totalHours = dayLogs.reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);

              const monthLogs = timeEntries.filter(e => String(e.userId) === String(u.id) && e.date.startsWith(selectedMonth) && parseFloat(e.duration || 0) > 0);
              const employeeUniqueDays = new Set(monthLogs.map(e => e.date)).size;

              let complianceStatus = 'Compliant';
              let complianceColor = '#22c55e';
              let complianceBg = 'rgba(34, 197, 94, 0.1)';

              if (totalHours === 0) {
                if (isWeekendDay) {
                  complianceStatus = 'No Log (Weekend/Off)';
                  complianceColor = '#64748b';
                  complianceBg = 'rgba(100, 116, 139, 0.1)';
                } else {
                  complianceStatus = `No Log (Working Day) - Auto-Flag: ${policy}`;
                  complianceColor = '#ef4444';
                  complianceBg = 'rgba(239, 68, 68, 0.1)';
                }
              }

              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>{u.name}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{u.role}</td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalHours.toFixed(1)}h</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', color: complianceColor, backgroundColor: complianceBg, border: `1px solid ${complianceColor}30`, display: 'inline-block' }}>
                      {complianceStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{employeeUniqueDays} days</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Timesheets() {
  const [activeTab, setActiveTab] = useState('modern');

  return (
    <div className="w-full min-h-screen bg-slate-100 p-6 flex flex-col gap-4" style={{ zoom: 'var(--page-zoom, 0.9)' }}>
      {/* Header */}
      <div className="timesheet-header flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Timesheets Console</h1>
          <p className="text-sm text-slate-500 mt-1">Review employee timesheets, audit hours, and track team compliance</p>
        </div>
        <div className="timesheet-tabs flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'tree' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'tree' ? { backgroundColor: '#0010ae' } : {}}
          >
            <Layers size={16} /> Tree View
          </button>
          <button 
            onClick={() => setActiveTab('classic')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'classic' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'classic' ? { backgroundColor: '#0010ae' } : {}}
          >
            <Filter size={16} /> Classic
          </button>
          <button 
            onClick={() => setActiveTab('modern')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'modern' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'modern' ? { backgroundColor: '#0010ae' } : {}}
          >
            <Activity size={16} /> Modern
          </button>
          <button 
            onClick={() => setActiveTab('compliance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'compliance' ? 'text-white shadow-sm font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
            style={activeTab === 'compliance' ? { backgroundColor: '#0010ae' } : {}}
          >
            <ShieldCheck size={16} /> Compliance
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {activeTab === 'modern' && <ModernDailyTimesheets />}
      {activeTab === 'classic' && <ClassicTimesheets />}
      {activeTab === 'tree' && <TreeTimesheets />}
      {activeTab === 'compliance' && <ComplianceConsole />}
    </div>
  );
}
