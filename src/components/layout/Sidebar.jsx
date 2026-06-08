import React from 'react';
import {
  Clock,
  Calendar,
  CheckSquare,
  Users,
  Fingerprint,
  Megaphone,
  GitPullRequest,
  User,
  UserCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Bell,
  Link2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ currentPage, setCurrentPage, isCollapsed, setIsCollapsed }) {
  const { currentUser, notifications = [] } = useApp();

  if (!currentUser) return null;

  const userNotifications = notifications.filter(n => n.recipientId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const isAdminView = currentPage.startsWith('admin-');
  const isLeadView = currentPage.startsWith('lead-');
  const isEmployeeMode = !isAdminView && !isLeadView;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getLinkStyle = () => isCollapsed ? { justifyContent: 'center', padding: '0.85rem 0' } : {};

  const renderSectionHeader = (title, isFirst = false) => {
    if (isCollapsed) {
      return <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: isFirst ? '4px 0 8px 0' : '12px 0 8px 0' }} />;
    }
    return (
      <div className="sidebar-section-title" style={isFirst ? { marginTop: '0.25rem' } : {}}>
        {title}
      </div>
    );
  };

  const renderAlertsLink = (alertsPageKey) => (
    <button
      className={`sidebar-link ${currentPage === alertsPageKey ? 'active' : ''}`}
      onClick={() => setCurrentPage(alertsPageKey)}
      style={getLinkStyle()}
      title={isCollapsed ? 'Alerts Center' : undefined}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={isCollapsed ? 'sidebar-notif-dot' : 'sidebar-notif-badge'}>
            {isCollapsed ? '' : unreadCount}
          </span>
        )}
      </div>
      {!isCollapsed && <span>Alerts Center</span>}
    </button>
  );

  const renderNavLinks = () => {
    if (currentUser.role === 'Admin' && !isEmployeeMode) {
      return (
        <>
          {renderSectionHeader('Admin View', true)}
          <button className={`sidebar-link ${currentPage === 'admin-dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-dashboard')} style={getLinkStyle()} title={isCollapsed ? 'Dashboard' : undefined}>
            <Clock size={18} />{!isCollapsed && <span>Dashboard</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'admin-teams' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-teams')} style={getLinkStyle()} title={isCollapsed ? 'Teams' : undefined}>
            <Users size={18} />{!isCollapsed && <span>Teams</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'admin-projects' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-projects')} style={getLinkStyle()} title={isCollapsed ? 'Projects' : undefined}>
            <Briefcase size={18} />{!isCollapsed && <span>Projects</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'admin-employees' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-employees')} style={getLinkStyle()} title={isCollapsed ? 'Employees' : undefined}>
            <Users size={18} />{!isCollapsed && <span>Employees</span>}
          </button>

          {renderSectionHeader('Operations')}
          {renderAlertsLink('admin-alerts')}
          <button className={`sidebar-link ${currentPage === 'admin-timesheets' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-timesheets')} style={getLinkStyle()} title={isCollapsed ? 'Timesheets' : undefined}>
            <Calendar size={18} />{!isCollapsed && <span>Timesheets</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'admin-tasks' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-tasks')} style={getLinkStyle()} title={isCollapsed ? 'Tasks' : undefined}>
            <CheckSquare size={18} />{!isCollapsed && <span>Tasks</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'admin-approvals' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-approvals')} style={getLinkStyle()} title={isCollapsed ? 'Approvals' : undefined}>
            <UserCheck size={18} />{!isCollapsed && <span>Approvals</span>}
          </button>

          {renderSectionHeader('Communication')}
          <button className={`sidebar-link ${currentPage === 'admin-announcements' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-announcements')} style={getLinkStyle()} title={isCollapsed ? 'Feed' : undefined}>
            <Megaphone size={18} />{!isCollapsed && <span>Feed</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'admin-meetings' ? 'active' : ''}`} onClick={() => setCurrentPage('admin-meetings')} style={getLinkStyle()} title={isCollapsed ? 'Link Room' : undefined}>
            <Link2 size={18} />{!isCollapsed && <span>Link Room</span>}
          </button>
        </>
      );
    }

    if ((currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') && !isEmployeeMode) {
      return (
        <>
          {renderSectionHeader('General', true)}
          <button className={`sidebar-link ${currentPage === 'lead-announcements' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-announcements')} style={getLinkStyle()} title={isCollapsed ? 'Announcements' : undefined}>
            <Megaphone size={18} />{!isCollapsed && <span>Announcements</span>}
          </button>
          {renderAlertsLink('lead-alerts')}
          <button className={`sidebar-link ${currentPage === 'lead-teams' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-teams')} style={getLinkStyle()} title={isCollapsed ? 'My Team' : undefined}>
            <Users size={18} />{!isCollapsed && <span>My Team Directory</span>}
          </button>

          {renderSectionHeader('Operations')}
          <button className={`sidebar-link ${currentPage === 'lead-dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-dashboard')} style={getLinkStyle()} title={isCollapsed ? 'Time Clock' : undefined}>
            <Clock size={18} />{!isCollapsed && <span>Time Clock</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'lead-timesheet' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-timesheet')} style={getLinkStyle()} title={isCollapsed ? 'Timesheet' : undefined}>
            <Calendar size={18} />{!isCollapsed && <span>Timesheet</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'lead-tasks' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-tasks')} style={getLinkStyle()} title={isCollapsed ? 'Tasks' : undefined}>
            <CheckSquare size={18} />{!isCollapsed && <span>Tasks</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'lead-attendance' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-attendance')} style={getLinkStyle()} title={isCollapsed ? 'Team Attendance' : undefined}>
            <Fingerprint size={18} />{!isCollapsed && <span>Team Attendance</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'lead-approvals' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-approvals')} style={getLinkStyle()} title={isCollapsed ? 'Approvals' : undefined}>
            <UserCheck size={18} />{!isCollapsed && <span>Approvals</span>}
          </button>
          <button className={`sidebar-link ${currentPage === 'lead-requests' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-requests')} style={getLinkStyle()} title={isCollapsed ? 'Requests' : undefined}>
            <GitPullRequest size={18} />{!isCollapsed && <span>Requests</span>}
          </button>

          {renderSectionHeader('Communication')}
          <button className={`sidebar-link ${currentPage === 'lead-meetings' ? 'active' : ''}`} onClick={() => setCurrentPage('lead-meetings')} style={getLinkStyle()} title={isCollapsed ? 'Link Room' : undefined}>
            <Link2 size={18} />{!isCollapsed && <span>Link Room</span>}
          </button>
        </>
      );
    }

    // Employee view (also used by Admin/Lead when on non-prefixed routes)
    return (
      <>
        {renderSectionHeader('General', true)}
        <button className={`sidebar-link ${currentPage === 'announcements' ? 'active' : ''}`} onClick={() => setCurrentPage('announcements')} style={getLinkStyle()} title={isCollapsed ? 'Feed' : undefined}>
          <Megaphone size={18} />{!isCollapsed && <span>Feed</span>}
        </button>
        {renderAlertsLink('alerts')}

        {renderSectionHeader('Operations')}
        <button className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')} style={getLinkStyle()} title={isCollapsed ? 'Time Clock' : undefined}>
          <Clock size={18} />{!isCollapsed && <span>Time Clock</span>}
        </button>
        <button className={`sidebar-link ${currentPage === 'timesheet' ? 'active' : ''}`} onClick={() => setCurrentPage('timesheet')} style={getLinkStyle()} title={isCollapsed ? 'Weekly Timesheet' : undefined}>
          <Calendar size={18} />{!isCollapsed && <span>Weekly Timesheet</span>}
        </button>
        <button className={`sidebar-link ${currentPage === 'tasks' ? 'active' : ''}`} onClick={() => setCurrentPage('tasks')} style={getLinkStyle()} title={isCollapsed ? 'Tasks' : undefined}>
          <CheckSquare size={18} />{!isCollapsed && <span>Tasks</span>}
        </button>
        <button className={`sidebar-link ${currentPage === 'attendance' ? 'active' : ''}`} onClick={() => setCurrentPage('attendance')} style={getLinkStyle()} title={isCollapsed ? 'Attendance' : undefined}>
          <Fingerprint size={18} />{!isCollapsed && <span>Attendance</span>}
        </button>

        {renderSectionHeader('Communication')}
        <button className={`sidebar-link ${currentPage === 'meetings' ? 'active' : ''}`} onClick={() => setCurrentPage('meetings')} style={getLinkStyle()} title={isCollapsed ? 'Link Room' : undefined}>
          <Link2 size={18} />{!isCollapsed && <span>Link Room</span>}
        </button>
        <button className={`sidebar-link ${currentPage === 'teams' ? 'active' : ''}`} onClick={() => setCurrentPage('teams')} style={getLinkStyle()} title={isCollapsed ? 'Directory' : undefined}>
          <Users size={18} />{!isCollapsed && <span>Directory</span>}
        </button>
        <button className={`sidebar-link ${currentPage === 'settings' ? 'active' : ''}`} onClick={() => setCurrentPage('settings')} style={getLinkStyle()} title={isCollapsed ? 'Profile' : undefined}>
          <User size={18} />{!isCollapsed && <span>Profile</span>}
        </button>
      </>
    );
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      style={{
        width: isCollapsed ? '64px' : '240px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: isCollapsed ? '8px 8px 16px 8px' : '8px 12px 16px 12px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        transition: 'width 0.25s ease, padding 0.25s ease'
      }}
    >
      {/* Collapse toggle */}
      <div style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end', marginBottom: '6px' }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            background: 'none', border: 'none', outline: 'none', cursor: 'pointer',
            padding: '6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--bg-canvas)'
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {renderNavLinks()}
      </nav>

      {/* Bottom profile strip */}
      <div style={{
        marginTop: 'auto',
        padding: isCollapsed ? '12px 0' : '12px 8px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: '8px'
      }}>
        <div className="user-initials-badge" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
          {getInitials(currentUser.name)}
        </div>
        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              {isEmployeeMode ? 'Employee view' : `${currentUser.role} mode`}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}