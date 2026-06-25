import React, { useState } from "react";
import { TODAY } from '../../utils/dateHelpers';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

import DataTable from '../ui/DataTable';

const STATUS_ORDER = ['Open', 'In Progress', 'Pending Review', 'Completed', 'Backlog'];
const STATUS_COLORS = {
  'Open': 'var(--muted-foreground)',
  'In Progress': 'var(--chart-1)',
  'Pending Review': '#f59e0b',
  'Completed': '#22c55e',
  'Backlog': '#a855f7',
};

function Modal({ proj, tasks, users, onClose }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const role = currentUser?.role;
  const [activeStatus, setActiveStatus] = useState('All');
  
  const projTasks = tasks.filter(t => t.projectId === proj.id);

  const statusCounts = {};
  STATUS_ORDER.forEach(s => {
    statusCounts[s] = projTasks.filter(t =>
      s === 'Backlog' ? (!t.assignedTo || t.assignedTo === '') : t.status === s
    ).length;
  });

  const filtered = activeStatus === 'All'
    ? projTasks
    : activeStatus === 'Backlog'
      ? projTasks.filter(t => !t.assignedTo || t.assignedTo === '')
      : projTasks.filter(t => t.status === activeStatus);

  const tabs = ['All', ...STATUS_ORDER.filter(s => statusCounts[s] > 0)];

  const handleNavigateTask = (taskId) => {
    const target = role === 'Admin' ? '/admin/tasks' : (role === 'Team Lead' || role === 'Sub Lead') ? '/lead/tasks' : '/tasks';
    navigate(target, { state: { highlightTaskId: taskId } });
    onClose();
  };

  const columns = React.useMemo(() => [
    {
      accessorKey: 'taskNumber',
      header: 'TASK ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs px-2 py-1 rounded border border-slate-200 bg-slate-50 text-slate-500 whitespace-nowrap">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'TASK NAME',
      cell: ({ getValue }) => (
        <span className="font-semibold text-xs text-slate-700">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'assignedTo',
      header: 'ASSIGNEE',
      cell: ({ getValue }) => {
        const assignee = users.find(u => u.id === getValue());
        if (!assignee) return <span className="text-xs text-slate-400 italic">Unassigned</span>;
        return <span className="text-xs text-slate-700">{assignee.name}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ getValue }) => {
        const val = getValue();
        const color = STATUS_COLORS[val] || 'var(--muted-foreground)';
        return (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700,
            color,
            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
            borderRadius: 4, padding: '2px 7px',
            textTransform: 'uppercase'
          }}>
            {val}
          </span>
        );
      }
    },
    {
      accessorKey: 'priority',
      header: 'PRIORITY',
      cell: ({ getValue }) => {
        const p = getValue();
        const color = p === 'Critical' ? '#ef4444' : p === 'High' ? '#f59e0b' : p === 'Medium' ? '#3b82f6' : '#94a3b8';
        const bg = p === 'Critical' ? 'rgba(239,68,68,0.1)' : p === 'High' ? 'rgba(245,158,11,0.1)' : p === 'Medium' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)';
        return (
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: bg, color }}>
            {p}
          </span>
        );
      },
    },
  ], [users]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        backgroundColor: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '850px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '1rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: proj.color || '#3b82f6', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                {proj.name?.split(' (')[0]}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                {projTasks.length} task{projTasks.length !== 1 ? 's' : ''} total
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)', fontSize: '1.25rem', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {tabs.map(tab => {
            const isActive = activeStatus === tab;
            const color = tab === 'All' ? 'var(--foreground)' : STATUS_COLORS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveStatus(tab)}
                style={{
                  fontSize: '0.68rem', fontWeight: 600, padding: '3px 10px',
                  borderRadius: '6px', cursor: 'pointer', border: '1px solid',
                  borderColor: isActive ? color : 'var(--border)',
                  backgroundColor: isActive ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
                  color: isActive ? color : 'var(--muted-foreground)',
                  transition: 'all 0.15s',
                }}
              >
                {tab} {tab !== 'All' && `(${statusCounts[tab]})`}
              </button>
            );
          })}
        </div>

        {/* Task List Table */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {filtered.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>No tasks found.</p>
          ) : (
            <DataTable
              Data={filtered}
              columns={columns}
              onRowClick={(t) => handleNavigateTask(t.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projectprogresspannel({ projects, tasks }) {
    const { users } = useApp();
    const [selectedprojectid, setselectprojectid] = useState('ALL');
    const [selectedProj, setSelectedProj] = useState(null);

    const activeprojects = projects.filter(p => p.status === 'Active');
    const filteredprojects = selectedprojectid === 'ALL' ?
        activeprojects :
        activeprojects.filter(p => String(p.id) === String(selectedprojectid));

    return (
        <>
            <div className="bg-card border border-border rounded-[10px] p-4 flex flex-col overflow-hidden h-full">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
 
                        <span className="font-semibold text-[0.85rem] text-foreground">Project Progress</span>
                    </div>
                    
                </div>
                <div className="flex flex-col gap-3.5 overflow-y-auto flex-1 pr-1">
                    {!filteredprojects.length ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-[0.8rem]">
                            No active projects
                        </div>
                    ) : (
                        filteredprojects.map(proj => {
                            const projtasks = tasks.filter(t => t.projectId === proj.id);
                            const done = projtasks.filter(t => t.status?.toUpperCase() === "COMPLETED").length;
                            const total = projtasks.length;
                            const pct = total > 0 ? Math.round((done / total) * 100) : (proj.progress || 0);
                            const overdue = projtasks.filter(t => {
                                const s = t.status?.toUpperCase();
                                return s !== 'COMPLETED' && s !== 'REJECTED' && t.etaDate && new Date(t.etaDate) < new Date(TODAY);
                            }).length;
                            return (
                                <div 
                                    key={proj.id} 
                                    onClick={() => setSelectedProj(proj)}
                                    className="p-3 bg-secondary rounded-lg border border-border flex flex-col gap-2 cursor-pointer transition-all hover:border-primary"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: proj.color || '#3b82f6' }}
                                            />
                                            <span className="font-semibold text-[0.8rem] text-foreground">
                                                {proj.name?.split(' (')[0]}
                                            </span>
                                        </div>
                                        <span className="text-[0.75rem] font-bold text-foreground">{pct}%</span>
                                    </div>
                                    <div className="w-full">
                                        <div className="h-1.5 bg-border rounded-[3px] mb-1.5 overflow-hidden w-full">
                                            <div
                                                className="h-full rounded-[3px] transition-[width] duration-500 ease-in-out"
                                                style={{ backgroundColor: proj.color || '#3b82f6', width: `${pct}%` }}
                                            />
                                        </div>
                                        <div className="flex gap-3 text-[0.68rem] text-muted-foreground">
                                            <span>{done}/{total} tasks done</span>
                                            {overdue > 0 && <span className="text-red-500 font-semibold">⚠ {overdue} overdue</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {selectedProj && (
                <Modal 
                    proj={selectedProj} 
                    tasks={tasks} 
                    users={users} 
                    onClose={() => {
                        setSelectedProj(null);
                        setselectprojectid('ALL');
                    }} 
                />
            )}
        </>
    );
}
