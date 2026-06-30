import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Users,

  Megaphone,
  GitPullRequest,
  User,
  UserCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Bell,
  Link2,
  Archive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate,useLocation,NavLink } from 'react-router-dom';

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const { currentUser, users = [], notifications = [] } = useApp();
  const navigate=useNavigate();
  const location=useLocation();
  const currentpath=location.pathname;

  if (!currentUser) return null;

  const displayUser = users.find(u => 
    String(u.id) === String(currentUser?.id) || 
    (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.workEmail && currentUser?.email && u.workEmail.toLowerCase() === currentUser.email.toLowerCase())
  ) || currentUser;
  console.log(displayUser.role)

  const userNotifications = notifications.filter(n => n.recipientId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const isAdminView = currentUser.role === 'Admin' && !currentpath.startsWith('/lead') && currentpath !== '/dashboard' && currentpath !== '/timesheet';
  const isLeadView = (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') && !currentpath.startsWith('/admin');
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

  const renderAlertsLink = (alertsPath) => (
    <NavLink
    to={alertsPath}
    className={({isActive})=>`sidebar-link ${isActive?'active':''}`}
    style={getLinkStyle()}
    title={isCollapsed?'Alerts Center':undefined}
    >
      <div
      style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}
      >
        <Bell size={18}/>
        {unreadCount>0&&(
          <span className={isCollapsed?'sidebar-notif-dot':'sidebar-notif-badge'}>
            {isCollapsed?'':unreadCount}
          </span>
        )}

      </div>
      {!isCollapsed&&<span>Alerts Center</span>}
    </NavLink>
  );

const renderNavLinks = () => {

  // ── ADMIN VIEW ──────────────────────────────────────────────
  if (currentUser.role === 'Admin' && !isEmployeeMode) {
    return (
      <>
        {renderSectionHeader('Admin view', true)}
        <NavLink to="/admin/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Dashboard' : undefined}>
          <LayoutDashboard size={18} />{!isCollapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/admin/employees" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Employees' : undefined}>
          <Users size={18} />{!isCollapsed && <span>Employees</span>}
        </NavLink>
        <NavLink to="/admin/teams" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Teams' : undefined}>
          <Users size={18} />{!isCollapsed && <span>Teams</span>}
        </NavLink>
        <NavLink to="/admin/projects" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Projects' : undefined}>
          <Briefcase size={18} />{!isCollapsed && <span>Projects</span>}
        </NavLink>

        {renderSectionHeader('Operations')}
        <NavLink to="/admin/tasks" className={`sidebar-link ${(currentpath === '/admin/tasks' || currentpath === '/admin/backlog') ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Tasks' : undefined}>
          <CheckSquare size={18} />{!isCollapsed && <span>Tasks</span>}
        </NavLink>
        <NavLink to="/admin/timesheets" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Timesheets' : undefined}>
          <Calendar size={18} />{!isCollapsed && <span>Timesheets</span>}
        </NavLink>
        <NavLink to="/admin/approvals" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Approvals' : undefined}>
          <UserCheck size={18} />{!isCollapsed && <span>Approvals</span>}
        </NavLink>
        {renderAlertsLink('/alerts')}

        {renderSectionHeader('Communication')}
        <NavLink to="/admin/announcements" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Feed' : undefined}>
          <Megaphone size={18} />{!isCollapsed && <span>Feed</span>}
        </NavLink>
        <NavLink to="/admin/meetings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Link Room' : undefined}>
          <Link2 size={18} />{!isCollapsed && <span>Link Room</span>}
        </NavLink>

        {renderSectionHeader('Account')}
        <NavLink to="/settings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Profile' : undefined}>
          <User size={18} />{!isCollapsed && <span>Profile</span>}
        </NavLink>
      </>
    );
  }

  // ── TEAM LEAD / SUB LEAD VIEW ───────────────────────────────
  if ((currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') && !isEmployeeMode) {
    return (
      <>
        {renderSectionHeader('Work', true)}
        <NavLink to="/lead/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Dashboard' : undefined}>
          <LayoutDashboard size={18} />{!isCollapsed && <span>Dashboard</span>}
        </NavLink>
        <NavLink to="/lead/tasks" className={`sidebar-link ${(currentpath === '/lead/tasks' || currentpath === '/lead/backlog' || currentpath === '/backlog') ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Tasks' : undefined}>
          <CheckSquare size={18} />{!isCollapsed && <span>Tasks</span>}
        </NavLink>
        <NavLink to="/lead/timesheet" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Timesheet' : undefined}>
          <Calendar size={18} />{!isCollapsed && <span>Timesheet</span>}
        </NavLink>


        {renderSectionHeader('Management')}
        <NavLink to="/lead/approvals" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Approvals' : undefined}>
          <UserCheck size={18} />{!isCollapsed && <span>Approvals</span>}
        </NavLink>
        <NavLink to="/lead/teams" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'My Team' : undefined}>
          <Users size={18} />{!isCollapsed && <span>My Teams </span>}
        </NavLink>
        <NavLink to="/lead/projects" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Projects' : undefined}>
          <Briefcase size={18} />{!isCollapsed && <span>My Projects</span>}
        </NavLink>
        {renderAlertsLink('/alerts')}

        {renderSectionHeader('Communication')}
        <NavLink to="/lead/meetings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Link Room' : undefined}>
          <Link2 size={18} />{!isCollapsed && <span>Link Room</span>}
        </NavLink>
        {currentUser.role !== 'Sub Lead' && (
          <NavLink to="/lead/announcements" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Feed' : undefined}>
            <Megaphone size={18} />{!isCollapsed && <span>Feed</span>}
          </NavLink>
        )}

        {renderSectionHeader('Account')}
        <NavLink to="/settings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Profile' : undefined}>
          <User size={18} />{!isCollapsed && <span>Profile</span>}
        </NavLink>
      </>
    );
  }

  // ── EMPLOYEE VIEW ───────────────────────────────────────────
  return (
    <>
      {renderSectionHeader('Work', true)}
      <NavLink to="/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Dashboard' : undefined}>
        <LayoutDashboard size={18} />{!isCollapsed && <span>Dashboard</span>}
      </NavLink>
      <NavLink to="/tasks" className={`sidebar-link ${(currentpath === '/tasks' || currentpath === '/backlog') ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Tasks' : undefined}>
        <CheckSquare size={18} />{!isCollapsed && <span>Tasks</span>}
      </NavLink>
      <NavLink to="/timesheet" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Timesheet' : undefined}>
        <Calendar size={18} />{!isCollapsed && <span>Timesheet</span>}
      </NavLink>

      {renderSectionHeader('Communication')}
      <NavLink to="/meetings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Link Room' : undefined}>
        <Link2 size={18} />{!isCollapsed && <span>Link Room</span>}
      </NavLink>
      <NavLink to="/teams" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'My Teams' : undefined}>
        <Users size={18} />{!isCollapsed && <span>My Teams</span>}
      </NavLink>
      <NavLink to="/projects" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'My Projects' : undefined}>
        <Briefcase size={18} />{!isCollapsed && <span>My Projects</span>}
      </NavLink>
      {currentUser.role !== 'Sub Lead' && (
        <NavLink to="/announcements" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Feed' : undefined}>
          <Megaphone size={18} />{!isCollapsed && <span>Feed</span>}
        </NavLink>
      )}
      {renderAlertsLink('/alerts')}
      {renderSectionHeader('Account')}
      <NavLink to="/settings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`} style={getLinkStyle()} title={isCollapsed ? 'Profile' : undefined}>
        <User size={18} />{!isCollapsed && <span>Profile</span>}
      </NavLink>
    </>
  );
};
  return (
    <>
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}
      <aside
        className={`app-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}
      style={{
        width: isCollapsed ? '64px' : '240px',
        backgroundColor: 'var(--background)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: isCollapsed ? '8px 8px 0 8px' : '8px 12px 0 12px',
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
            justifyContent: 'center', borderRadius: '50%', backgroundColor: 'var(--secondary)'
          }}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        overflowY: 'auto',
        minHeight: 0
      }}>
        {renderNavLinks()}
      </nav>

      {/* Bottom profile strip */}
      <div style={{
        marginTop: 'auto',
        padding: isCollapsed ? '12px 0' : '12px 8px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        gap: '8px'
      }}>
        <div className="user-initials-badge" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
          {getInitials(displayUser.name)}
        </div>
        {!isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayUser.name}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)' }}>
              {isEmployeeMode ? 'Employee view' : `${displayUser.role} mode`}
            </span>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}