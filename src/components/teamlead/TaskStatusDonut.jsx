import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

import DataTable from '../ui/DataTable';

const STATUS_COLORS = {
  OPEN: '#6b7280', 
  IN_PROGRESS: '#3b82f6', 
  PENDING_REVIEW: '#f59e0b',
  COMPLETED: '#10b981', 
  OVER_ETA: '#ef4444', 
  ETA_EXTENDED: '#f97316',
  REJECTED: '#dc2626', 
  TRANSFERRED: '#8b5cf6',
  BACKLOG: '#a855f7',
};

function Modal({ status, tasks, users, projects, onClose }) {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const role = currentUser?.role;

  const filteredTasks = tasks.filter(t => {
    const s = t.status?.toUpperCase().replace(' ', '_') || 'OPEN';
    return s === status;
  });

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
      accessorKey: 'projectId',
      header: 'PROJECT',
      cell: ({ getValue }) => {
        const proj = projects.find(p => p.id === getValue());
        return (
          <span className="text-xs font-semibold" style={{ color: proj?.color || '#94a3b8' }}>
            {proj ? proj.name.split(' (')[0] : 'General'}
          </span>
        );
      },
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
  ], [projects, users]);

  const statusLabel = status.replace(/_/g, ' ');
  const statusColor = STATUS_COLORS[status] || '#94a3b8';

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
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'capitalize', margin: 0 }}>
                {statusLabel.toLowerCase()} Tasks
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} total
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)', fontSize: '1.25rem', lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>

        {/* Task List Table */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {filteredTasks.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>No tasks found in this status.</p>
          ) : (
            <DataTable
              Data={filteredTasks}
              columns={columns}
              onRowClick={(t) => handleNavigateTask(t.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskStatusDonut({ tasks }) {
  const { users, projects } = useApp();
  const [selectedStatus, setSelectedStatus] = useState(null);

  const counts = {};
  tasks.forEach(t => {
    const s = t.status?.toUpperCase().replace(' ', '_') || 'OPEN';
    counts[s] = (counts[s] || 0) + 1;
  });
  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)', fontSize: '0.8rem', minHeight: '140px' }}>
      No tasks found
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full h-full min-h-0 py-1">
        {/* Donut Chart with fixed size to guarantee rendering under all layout engines */}
        <div className="flex items-center justify-center shrink-0 cursor-pointer" style={{ width: 140, height: 140 }}>
          <PieChart width={140} height={140}>
            <Pie 
              data={data} 
              dataKey="value" 
              cx="50%" 
              cy="50%" 
              innerRadius={42} 
              outerRadius={60} 
              paddingAngle={2} 
              startAngle={90} 
              endAngle={-270}
              strokeWidth={0}
              onClick={(entry) => setSelectedStatus(entry.name)}
              style={{ outline: 'none' }}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} style={{ outline: 'none' }} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem' }}
              formatter={(value, name) => [value, name.replace(/_/g, ' ')]}
            />
          </PieChart>
        </div>

        {/* Legend List */}
        <div className="flex flex-col gap-1.5 text-[0.72rem] overflow-y-auto flex-1 w-full pr-1 max-h-[150px] sm:max-h-full">
          {data.map(d => (
            <div 
              key={d.name} 
              className="flex items-center gap-2 cursor-pointer hover:bg-secondary rounded p-0.5 transition-colors duration-150"
              onClick={() => setSelectedStatus(d.name)}
            >
              <div 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ background: STATUS_COLORS[d.name] || '#94a3b8' }} 
              />
              <span className="text-muted-foreground flex-1 truncate">
                {d.name.replace(/_/g, ' ')}
              </span>
              <span className="font-semibold text-foreground ml-auto">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedStatus && (
        <Modal 
          status={selectedStatus} 
          tasks={tasks} 
          users={users} 
          projects={projects} 
          onClose={() => setSelectedStatus(null)} 
        />
      )}
    </>
  );
}