import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare, AlertTriangle, Clock, UserCheck, Calendar, Archive, TrendingUp, ArrowRight, ExternalLink
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import EmployeeKpiCards from '../../components/dashboard/EmployeeKpiCards';
import ChartCard from '../../components/teamlead/ChartCard';
import TaskStatusDonut from '../../components/teamlead/TaskStatusDonut';
import ProjectProgressPanel from '../../components/teamlead/ProjectProgressPanel';
import WorkCategoryChart from '../../components/dashboard/WorkCategoryChart';
import { getLast7Days, fmtDay, TODAY } from '../../utils/dateHelpers';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    projects,
    tasks,
    timeEntries,
    etaExtensions = [],
    taskTransfers = [],
  } = useApp();

  if (!currentUser) return null;

  // 1. Filter tasks assigned to current employee
  const myTasks = useMemo(() =>
    tasks.filter(t => String(t.assignedTo) === String(currentUser.id)),
    [tasks, currentUser.id]
  );

  // 2. Filter projects where employee is a member
  const myProjects = useMemo(() =>
    projects.filter(p => (p.members || []).some(mId => String(mId) === String(currentUser.id))),
    [projects, currentUser.id]
  );

  const myTimeEntries = useMemo(() =>
    timeEntries.filter(e => String(e.userId) === String(currentUser.id)),
    [timeEntries, currentUser.id]
  );

  const weekStart = getLast7Days()[0];

  // 3. Compute KPI metrics
  const kpiValues = {
    activeTasks: myTasks.filter(t => ['IN_PROGRESS', 'OPEN', 'PENDING_REVIEW'].includes(t.status?.toUpperCase())).length,
    overdueTasks: myTasks.filter(t => {
      const s = t.status?.toUpperCase();
      return s !== 'COMPLETED' && s !== 'REJECTED' && s !== 'TRANSFERRED' && t.etaDate && new Date(t.etaDate) < new Date(TODAY);
    }).length,
    hoursThisWeek: parseFloat(
      timeEntries.filter(e => String(e.userId) === String(currentUser.id) && e.date >= weekStart)
        .reduce((sum, e) => sum + parseFloat(e.duration || 0), 0).toFixed(1)
    ) + 'h',
    completedTasks: myTasks.filter(t => t.status?.toUpperCase() === 'COMPLETED').length,
    pendingETAs: etaExtensions.filter(e => String(e.requestedById) === String(currentUser.id) && e.status === 'PENDING').length,
    pendingTransfers: taskTransfers.filter(e =>
      (String(e.fromEmployeeId) === String(currentUser.id) || String(e.toEmployeeId) === String(currentUser.id)) &&
      e.status === 'PENDING'
    ).length,
  };

  // 4. Compute Daily Hours Data for the Last 7 Days (Area Chart)
  const days = getLast7Days();
  const dailyHoursData = days.map(day => {
    const total = timeEntries
      .filter(e => e.date === day && String(e.userId) === String(currentUser.id))
      .reduce((sum, e) => sum + parseFloat(e.duration || 0), 0);
    return { day: fmtDay(day), hours: parseFloat(total.toFixed(1)) };
  });

  const totalHoursWeek = dailyHoursData.reduce((sum, d) => sum + d.hours, 0).toFixed(1);

  // 5. Get top 5 recent active tasks
  const activeTasksList = useMemo(() => {
    return myTasks
      .filter(t => ['IN_PROGRESS', 'OPEN', 'PENDING_REVIEW'].includes(t.status?.toUpperCase()))
      .sort((a, b) => {
        const priorityWeight = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        const weightA = priorityWeight[a.priority?.toUpperCase()] || 0;
        const weightB = priorityWeight[b.priority?.toUpperCase()] || 0;
        if (weightB !== weightA) return weightB - weightA;
        return new Date(a.etaDate || '') - new Date(b.etaDate || '');
      })
      .slice(0, 5);
  }, [myTasks]);

  // Helper styles for priority/status badges
  const getPriorityStyle = (priority) => {
    const p = priority?.toUpperCase();
    if (p === 'CRITICAL') return { color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2' };
    if (p === 'HIGH') return { color: '#f97316', background: '#fff7ed', border: '1px solid #ffedd5' };
    if (p === 'MEDIUM') return { color: '#3b82f6', background: '#eff6ff', border: '1px solid #dbeafe' };
    return { color: '#6b7280', background: '#f9fafb', border: '1px solid #f3f4f6' };
  };

  const getStatusStyle = (status) => {
    const s = status?.toUpperCase();
    if (s === 'IN_PROGRESS') return { color: '#8b5cf6', background: '#f5f3ff', border: '1px solid #ede9fe' };
    if (s === 'PENDING_REVIEW') return { color: '#f59e0b', background: '#fef3c7', border: '1px solid #fde68a' };
    return { color: '#10b981', background: '#ecfdf5', border: '1px solid #d1fae5' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', overflowY: 'auto', height: '100%', boxSizing: 'border-box', padding: '0.25rem 0 1.5rem 0' }}>

      {/* KPI Cards Grid */}
      <EmployeeKpiCards kpis={kpiValues} onNavigate={navigate} />

      {/* Row 2: Task Status & Hours Chart */}
      <div className="employee-dashboard-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', height: '280px', flexShrink: 0 }}>
        
        {/* Task Status Breakdown */}
        <ChartCard title="My Task Breakdown" icon={CheckSquare} accent="#3b82f6">
          <TaskStatusDonut tasks={myTasks} />
        </ChartCard>

        {/* Weekly Hours Chart */}
        <ChartCard
          title={`My Logged Hours (${totalHoursWeek}h logged this week)`}
          icon={TrendingUp}
          accent="#8b5cf6"
        >
          <div style={{ width: '100%', height: '100%', minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyHoursData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="employeeHoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem' }}
                  formatter={v => [`${v}h`, 'My Hours']}
                />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#employeeHoursGradient)" dot={{ r: 3.5, fill: '#8b5cf6' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <WorkCategoryChart timeEntries={myTimeEntries} />
      </div>

      {/* Row 3: Active Tasks & Project Progress */}
      <div className="employee-dashboard-grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.875rem', height: '320px', flexShrink: 0 }}>
        
        {/* Active Tasks Panel */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={16} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--foreground)' }}>My Active Tasks</span>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#3b82f6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Manage Tasks <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingRight: 4 }}>
            {activeTasksList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>No active tasks assigned to you. Go claim some backlog tasks!</span>
              </div>
            ) : (
              activeTasksList.map(task => {
                const proj = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--secondary)',
                      borderRadius: 8,
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                          {task.taskNumber}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--foreground)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '0.68rem', color: 'var(--muted-foreground)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: proj?.color || '#3b82f6' }} />
                          <span>{proj?.name?.split(' (')[0] || 'Unassigned Project'}</span>
                        </div>
                        <span>•</span>
                        <span>Due: {task.etaDate || 'No Date'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        ...getPriorityStyle(task.priority)
                      }}>
                        {task.priority}
                      </span>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                        ...getStatusStyle(task.status)
                      }}>
                        {task.status?.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => navigate('/tasks')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--muted-foreground)',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--foreground)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                        title="View Task"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Projects Progress Panel */}
        <ChartCard title="My Projects Progress" icon={TrendingUp} accent="#10b981">
          <ProjectProgressPanel teamProjects={myProjects} tasks={tasks} />
        </ChartCard>

      </div>

    </div>
  );
}