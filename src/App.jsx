import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

// Employee Pages
import Tasks from './pages/employee/Tasks';
import EmployeeAttendance from './pages/employee/Attendance';
import Meetings from './pages/employee/Meetings';

// Team Lead / Sub Lead Pages
import TeamAttendance from './pages/lead/TeamAttendance';
import LeadRequests from './pages/lead/Requests';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Teams from './pages/admin/Teams';
import Projects from './pages/admin/Projects';
import Employees from './pages/admin/Employees';
import Approvals from './pages/admin/Approvals';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminTimesheets from './pages/admin/timesheets/ModernDailyTimesheets';

// Shared / Settings Pages
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import Backlog from './pages/Backlog';

function MainAppContent() {
  const { currentUser, isAuthenticated, changeUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('');
  const [prevUserId, setPrevUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
  changeUser('user-admin');
}, []);
  // Automatically adjust view if changing to a user who doesn't have access to the current page
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setPrevUserId(null);
      return;
    }

    const isAdmin = currentUser.role === 'Admin';
    const isTL = currentUser.role === 'Team Lead';
    const isSL = currentUser.role === 'Sub Lead';
    const isEmployee = currentUser.role === 'Employee';

    // When the user first logs in or switches users in demo, route to their default view
    if (prevUserId !== currentUser.id) {
      setPrevUserId(currentUser.id);
      if (isAdmin) {
        setCurrentPage('admin-dashboard');
      } else if (isTL || isSL) {
        setCurrentPage('lead-dashboard');
      } else {
        setCurrentPage('dashboard');
      }
      return;
    }

    // Route scoping checks
    if (isAdmin) {
      const adminRoutes = [
        'admin-dashboard', 'admin-timesheets', 'admin-tasks', 'admin-backlog', 'admin-teams', 'admin-projects', 
        'admin-employees', 'admin-approvals', 'admin-announcements', 'admin-meetings', 'settings',
        'dashboard', 'timesheet', 'tasks', 'backlog', 'attendance', 'meetings', 'teams', 'announcements',
        'admin-alerts', 'alerts'
      ];
      if (!adminRoutes.includes(currentPage)) {
        setCurrentPage('admin-dashboard');
      }
    } else if (isTL || isSL) {
      const leadRoutes = [
        'lead-dashboard', 'lead-timesheet', 'lead-tasks', 'lead-backlog', 'lead-attendance', 
        'lead-approvals', 'lead-requests', 'lead-announcements', 'lead-meetings', 'settings',
        'dashboard', 'timesheet', 'tasks', 'backlog', 'attendance', 'meetings', 'teams', 'lead-teams', 'announcements',
        'lead-alerts', 'alerts'
      ];
      if (!leadRoutes.includes(currentPage)) {
        setCurrentPage('lead-dashboard');
      }
    } else if (isEmployee) {
      const employeeRoutes = ['dashboard', 'timesheet', 'tasks', 'backlog', 'attendance', 'meetings', 'settings', 'teams', 'announcements', 'alerts'];
      if (!employeeRoutes.includes(currentPage)) {
        setCurrentPage('dashboard');
      }
    }
  }, [currentUser, isAuthenticated, currentPage, prevUserId]);

  // Global cursor tracking for card border highlights (Liquid Glass feature)
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const card = e.target.closest('.card, .liquid-glass-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  {/*Login guard */}
   if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  {/* Page title mapper*/}
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
      case 'lead-dashboard':
        return 'Time Tracker';
      case 'timesheet':
      case 'lead-timesheet':
        return 'Timesheet';
      case 'tasks':
      case 'admin-tasks':
      case 'lead-tasks':
        return 'Tasks';
      case 'backlog':
      case 'admin-backlog':
      case 'lead-backlog':
        return 'Backlog Tasks';
      case 'attendance':
        return 'Attendance';
      case 'meetings':
      case 'admin-meetings':
      case 'lead-meetings':
        return 'Link Room';
      case 'admin-dashboard':
        return 'Dashboard';
      case 'admin-timesheets':
        return 'Timesheets';
      case 'admin-teams':
        return 'Teams';
      case 'admin-projects':
        return 'Projects';
      case 'teams':
      case 'lead-teams':
        return currentUser.role === 'Admin' ? 'Teams & Projects' : 'My Team & Projects';
      case 'employees':
      case 'admin-employees':
        return 'Employees';
      case 'approvals':
      case 'admin-approvals':
      case 'lead-approvals':
        return 'Approvals';
      case 'team-attendance':
      case 'lead-attendance':
        return 'Team Attendance';
      case 'lead-requests':
        return 'Requests';
      case 'announcements':
      case 'admin-announcements':
      case 'lead-announcements':
        return 'Announcements';
      case 'settings':
        return 'Settings';
      case 'alerts':
      case 'admin-alerts':
      case 'lead-alerts':
        return 'Alerts Center';
      default:
        return 'TeamOps';
    }
  };

  // Render correct page body
  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
      case 'admin-tasks':
      case 'lead-tasks':
        return <Tasks setCurrentPage={setCurrentPage} />;
      case 'backlog':
      case 'admin-backlog':
      case 'lead-backlog':
        return <Backlog setCurrentPage={setCurrentPage} />;
      case 'attendance':
      case 'lead-attendance':
        return <EmployeeAttendance />;
      case 'meetings':
      case 'admin-meetings':
      case 'lead-meetings':
        return <Meetings />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-timesheets':
        return <AdminTimesheets />;
      case 'teams':
      case 'admin-teams':
      case 'lead-teams':
        return <Teams />;
      case 'admin-projects':
        return <Projects />;
      case 'employees':
      case 'admin-employees':
        return <Employees />;
      case 'approvals':
      case 'admin-approvals':
      case 'lead-approvals':
        return <Approvals />;
      case 'team-attendance':
        return <TeamAttendance />;
      case 'lead-requests':
        return <LeadRequests />;
      case 'announcements':
      case 'admin-announcements':
      case 'lead-announcements':
        return <AdminAnnouncements />;
      case 'settings':
        return <Settings />;
      case 'alerts':
      case 'admin-alerts':
      case 'lead-alerts':
        return <Alerts setCurrentPage={setCurrentPage} />;
      default:
        return <AdminDashboard />;
    }
  }
  return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <TopBar title={getPageTitle()} currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="content-body" style={{ flex: 1, overflowY: 'auto', position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-canvas)', padding: '24px' }}>
              <AnimatePresence mode="wait">
                <motion.div key={currentPage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} style={{ width: '100%' }}>
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    );
  }

  export default function App() {
    return (
      <AppProvider>
        <AuthProvider>
          <ThemeProvider>
            <TimerProvider>
              <MainAppContent />
            </TimerProvider>
          </ThemeProvider>
        </AuthProvider>
      </AppProvider>
    );
}
