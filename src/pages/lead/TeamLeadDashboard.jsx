import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare, AlertTriangle, Clock, UserCheck, Calendar, Archive, TrendingUp, Users
} from 'lucide-react';

import KpiCard from '../../components/teamlead/KpiCard';
import ChartCard from '../../components/teamlead/ChartCard';
import TaskStatusDonut from '../../components/teamlead/TaskStatusDonut';
import MemberLoadChart from '../../components/teamlead/MemberLoadChart';
import WeeklyTeamHoursChart from '../../components/teamlead/WeeklyTeamHoursChart';
import MemberPerformanceTable from '../../components/teamlead/MemberPerformanceTable';
import ProjectProgressPanel from '../../components/teamlead/ProjectProgressPanel';
import { getLast7Days, TODAY } from '../../utils/dateHelpers';
import { useNavigate } from 'react-router-dom';

const CARD_SCHEME = [
  { key: 'activeTasks',      label: 'Active Tasks',       icon: CheckSquare,   accent: '#3b82f6' },
  { key: 'overdueTasks',     label: 'ETA Overdue',      icon: AlertTriangle, accent: '#ef4444' },
  { key: 'pendingApprovals', label: 'Approvals',  icon: UserCheck,     accent: '#f59e0b' },
  { key: 'hoursThisWeek',    label: 'Team Hours',  icon: Clock,         accent: '#8b5cf6' },
  { key: 'tasksDueToday',    label: 'Due Today',          icon: Calendar,      accent: '#10b981' },
  { key: 'backlogTasks',     label: 'Backlog',      icon: Archive,       accent: '#6b7280' },
];

export default function TeamLeadDashboard() {
  const navigate=useNavigate();
  const { currentUser, users, teams, projects, tasks, timeEntries, reports } = useApp();

  if (!currentUser) return null;

  const myTeam = teams.find(t =>
    String(t.leadId) === String(currentUser.id) ||
    String(t.subLeadId) === String(currentUser.id)
  );
  const memberIds = myTeam?.members || [];

  const teamTasks = useMemo(() =>
    tasks.filter(t => memberIds.some(mid => String(mid) === String(t.assignedTo))),
    [tasks, memberIds]
  );

  const teamProjectIds = useMemo(() => {
    const ids = new Set();
    projects.forEach(p => {
      if (p.teams?.some(tid => tid === myTeam?.id)) ids.add(p.id);
    });
    teamTasks.forEach(t => { if (t.projectId) ids.add(t.projectId); });
    return [...ids];
  }, [projects, teamTasks, myTeam]);

  const teamProjects = projects.filter(p => teamProjectIds.includes(p.id));
  const weekStart = getLast7Days()[0];

  const kpis = {
    activeTasks: {
      value: teamTasks.filter(t => ['IN_PROGRESS', 'OPEN', 'PENDING_REVIEW'].includes(t.status?.toUpperCase())).length,
    },
    overdueTasks: {
      value: teamTasks.filter(t => {
        const s = t.status?.toUpperCase();
        return s !== 'COMPLETED' && s !== 'REJECTED' && s !== 'TRANSFERRED' && t.etaDate && new Date(t.etaDate) < new Date(TODAY);
      }).length,
    },
    pendingApprovals: {
      value: (reports || []).filter(r => memberIds.some(mid => String(mid) === String(r.userId)) && (r.status === 'Submitted' || r.status?.includes('Pending'))).length,
    },
    hoursThisWeek: {
      value: parseFloat(
        timeEntries.filter(e => memberIds.some(mid => String(mid) === String(e.userId)) && e.date >= weekStart)
          .reduce((sum, e) => sum + parseFloat(e.duration || 0), 0).toFixed(1)
      ) + 'h',
    },
    tasksDueToday: {
      value: teamTasks.filter(t => {
        const s = t.status?.toUpperCase();
        return s !== 'COMPLETED' && s !== 'REJECTED' && t.etaDate === TODAY;
      }).length,
    },
    backlogTasks: {
      value: tasks.filter(t => {
        const s = t.status?.toUpperCase();
        return !t.assignedTo && s !== 'COMPLETED' && s !== 'REJECTED';
      }).length,
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', overflowY: 'auto', height: '100%', boxSizing: 'border-box', padding: '0.25rem 0 1.5rem 0' }}>

      {myTeam && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>{myTeam.teamName}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', background: 'var(--secondary)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)' }}>
            {memberIds.length} members
          </span>
        </div>
      )}

      <div className="lead-kpi-grid" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', flexShrink: 0 }}>
        {CARD_SCHEME.map(({ key, label, icon, accent }) => {
          const kpi = kpis[key];
          return (
            <KpiCard
              key={key} icon={icon} label={label} value={kpi.value} sub={kpi.sub} accent={accent}
              onClick={
                key === 'pendingApprovals' ? () => navigate('/lead/approvals') :
                key === 'activeTasks'      ? () => navigate('/lead/tasks') :
                key === 'backlogTasks'     ? () => navigate('/backlog') :
                undefined
              }
            />
          );
        })}
      </div>

      <div className="lead-dashboard-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr', gap: '0.875rem', height: '260px', flexShrink: 0 }}>
        <ChartCard title="Task Status Breakdown" icon={CheckSquare} accent="#3b82f6">
          <TaskStatusDonut tasks={teamTasks} />
        </ChartCard>
        <ChartCard title="Member Task Load" icon={Users} accent="#8b5cf6">
          {memberIds.length > 0
            ? <MemberLoadChart members={memberIds} tasks={teamTasks} users={users} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>No members yet</div>}
        </ChartCard>
        <ChartCard title="Team Hours (Last 7 Days)" icon={TrendingUp} accent="#10b981">
          <WeeklyTeamHoursChart timeEntries={timeEntries} memberIds={memberIds} />
        </ChartCard>
      </div>

      <div className="lead-dashboard-grid-2" style={{ display: 'grid', gridTemplateColumns: '3fr 1.4fr', gap: '0.875rem', height: '300px', flexShrink: 0 }}>
        <ChartCard title="Member Performance" icon={UserCheck} accent="#f59e0b">
          <MemberPerformanceTable members={memberIds} tasks={teamTasks} users={users} timeEntries={timeEntries} />
        </ChartCard>
        <ChartCard title="Project Progress" icon={TrendingUp} accent="#3b82f6">
          <ProjectProgressPanel teamProjects={teamProjects} tasks={tasks} />
        </ChartCard>
      </div>

    </div>
  );
}