import React from 'react';
import { useApp } from '../../context/AppContext';
import KpiCards from '../../components/dashboard/KpiCards';
import StaffStatusChart from '../../components/dashboard/StaffStatusChart';
import HourRankings from '../../components/dashboard/HourRankings';
import WeeklyHoursChart from '../../components/dashboard/WeeklyHoursChart';
import ProjectTaskHealth from '../../components/dashboard/ProjectTaskHealth';
import WorkCategoryChart from '../../components/dashboard/WorkCategoryChart';

const TODAY = '2026-05-29';

export default function AdminDashboard({ setCurrentPage }) {
  const {
    currentUser, users, projects, tasks,
    timeEntries, reports, timerState,
    attendanceHistory, notifications = [],
  } = useApp();

  // ── Active Trackers ──────────────────────────────────────────
  const activeTrackers = [];

  if (timerState.isClockedIn) {
    const activeTask = tasks.find(t => t.id === timerState.taskId);
    const activeProj = projects.find(p => p.id === timerState.projectId);
    activeTrackers.push({
      user: currentUser,
      taskName: activeTask ? activeTask.name : timerState.description,
      proj: activeProj,
      isOnBreak: timerState.isOnBreak,
      startedAt: new Date(timerState.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  users.filter(u => u.id !== currentUser.id).forEach(u => {
    const att = attendanceHistory.find(a => a.employeeId === u.id && a.date === TODAY);
    if (att && att.clockStatus !== 'Offline') {
      const activeTask = tasks.find(t => t.assignedTo === u.id && t.status === 'In Progress');
      activeTrackers.push({
        user: u,
        taskName: activeTask ? activeTask.name : 'Working on general tasks',
        proj: activeTask ? projects.find(p => p.id === activeTask.projectId) : null,
        isOnBreak: att.clockStatus === 'On Break',
        startedAt: att.clockIn
          ? new Date(att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '09:00 AM',
      });
    }
  });

  const totalStaffList = users.filter(u => u.role !== 'Admin');

  // ── KPI Computations ────────────────────────────────────────
  const kpis = {
    staffOnline: {
      count: activeTrackers.filter(t => !t.isOnBreak).length,
      total: totalStaffList.length,
    },
    hoursToday: timeEntries
      .filter(e => e.date === TODAY)
      .reduce((sum, e) => sum + parseFloat(e.duration), 0),
    openTasks: tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length,
    overdueTasks: tasks.filter(t =>
      t.status !== 'Completed' && t.status !== 'Cancelled' &&
      t.etaDate && new Date(t.etaDate) < new Date(TODAY)
    ).length,
    pendingApprovals: (reports || []).filter(r =>
      r.status === 'Submitted' || r.status?.includes('Pending')
    ).length,
    backlogSize: tasks.filter(t => !t.assignedTo || t.assignedTo === '').length,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.875rem',
      overflowY: 'auto',
      height: '100%',
      boxSizing: 'border-box',
      padding: '0.25rem 0 1.5rem 0',
    }}>

      {/* Row 1 — KPI Cards */}
      <KpiCards kpis={kpis} onNavigate={setCurrentPage} />

      {/* Row 2 — Staff Status | Weekly Hours | Work Category */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr 1.2fr',
        gap: '0.875rem',
        height: '300px',
        flexShrink: 0,
      }}>
        <StaffStatusChart
          activeTrackers={activeTrackers}
          totalStaffList={totalStaffList}
          users={users}
          tasks={tasks}
          projects={projects}
        />
        <WeeklyHoursChart timeEntries={timeEntries} />
        <WorkCategoryChart timeEntries={timeEntries} />
      </div>

      {/* Row 3 — Project Task Health | Hour Rankings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 3fr',
        gap: '0.875rem',
        height: '420px',
        flexShrink: 0,
      }}>
        <ProjectTaskHealth tasks={tasks} projects={projects} />
        <HourRankings
          users={users}
          tasks={tasks}
          projects={projects}
          timeEntries={timeEntries}
        />
      </div>

    </div>
  );
}