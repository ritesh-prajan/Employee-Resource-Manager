import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import {Route,Routes,Navigate} from 'react-router-dom'
import Forgotpassword from './pages/Forgotpassword.jsx';
import Resetpassword from './pages/Resetpassword.jsx'
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalLoader from './components/GlobalLoader';

// Employee Pages
import Tasks from './pages/employee/Tasks';
import Attendance from './pages/employee/Attendance';
import Meetings from './pages/employee/Meetings';

// Team Lead / Sub Lead Pages
import TeamAttendance from './pages/lead/TeamAttendance';
import LeadRequests from './pages/lead/Requests';
import TeamLeadDashboard from './pages/lead/TeamLeadDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Teams from './pages/admin/Teams';
import Projects from './pages/admin/Projects';
import Employees from './pages/admin/Employees';
import Approvals from './pages/admin/Approvals';
import AdminAnnouncements from './pages/admin/Announcements';
import AdminTimesheets from './pages/admin/Timesheets';

// Shared / Settings Pages
import Alerts from './pages/Alerts';
import ProfileSettings from './pages/ProfileSettings';

function MainAppContent() {
  const { user: currentUser, isAuthenticated, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('');
  const [prevUserId, setPrevUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location=useLocation();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentPage]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setPrevUserId(null);
      return;
    }

    const isAdmin = currentUser.role === 'Admin';
    const isTL = currentUser.role === 'Team Lead';
    const isSL = currentUser.role === 'Sub Lead';
    const isEmployee = currentUser.role === 'Employee';

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

    if (isAdmin) {
      const adminRoutes = [
        'admin-dashboard', 'admin-timesheets', 'admin-tasks', 'admin-backlog', 'admin-teams', 'admin-projects',
        'admin-employees', 'admin-approvals', 'admin-announcements', 'admin-meetings', 'settings',
        'dashboard', 'timesheet', 'tasks', 'backlog', 'attendance', 'meetings', 'teams', 'announcements',
        'admin-alerts', 'alerts'
      ];
      if (!adminRoutes.includes(currentPage)) setCurrentPage('admin-dashboard');
    } else if (isTL || isSL) {
      const leadRoutes = [
        'lead-dashboard', 'lead-timesheet', 'lead-tasks', 'lead-backlog', 'lead-attendance','lead-projects',
        'lead-approvals', 'lead-requests', 'lead-announcements', 'lead-meetings', 'settings',
        'dashboard', 'timesheet', 'tasks', 'backlog', 'attendance', 'meetings', 'teams', 'lead-teams', 'announcements',
        'lead-alerts', 'alerts'
      ];
      if (!leadRoutes.includes(currentPage)) setCurrentPage('lead-dashboard');
    } else if (isEmployee) {
      const employeeRoutes = ['dashboard', 'timesheet', 'tasks', 'backlog', 'attendance', 'meetings', 'settings', 'teams', 'projects', 'announcements', 'alerts'];
      if (!employeeRoutes.includes(currentPage)) setCurrentPage('dashboard');
    }
  }, [currentUser, isAuthenticated, currentPage, prevUserId]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const card = e.target.closest('.card, .liquid-glass-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  if (loading) {
    return <GlobalLoader />;
  }

  if (location.pathname === "/reset-password") return <Resetpassword />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<Forgotpassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

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
      case 'attendance':
        return 'Attendance';
      case 'lead-attendance':
      case 'team-attendance':
        return 'Team Attendance';
      case 'meetings':
      case 'admin-meetings':
      case 'lead-meetings':
        return 'Link Room';
      case 'admin-dashboard':
        return 'Dashboard';
      case 'admin-timesheets':
        return 'Timesheets';
      case 'teams':
      case 'admin-teams':
      case 'lead-teams':
        return currentUser?.role === 'Admin' ? 'Teams' : 'My Teams';
      case 'projects':
      case 'admin-projects':
      case 'lead-projects':
        return currentUser?.role === 'Admin' ? 'Projects' : 'My Projects';
      case 'employees':
      case 'admin-employees':
        return 'Employees';
      case 'approvals':
      case 'admin-approvals':
      case 'lead-approvals':
        return 'Approvals';
      case 'lead-requests':
        return 'Requests';
      case 'announcements':
      case 'admin-announcements':
      case 'lead-announcements':
        return 'Announcements';
      case 'settings':
        return 'Profile';
      case 'alerts':
      case 'admin-alerts':
      case 'lead-alerts':
        return 'Alerts Center';
      default:
        return 'Elite';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
      case 'admin-tasks':
      case 'lead-tasks':
        return <Tasks setCurrentPage={setCurrentPage} />;
      case 'attendance':
        return <Attendance />;
      case 'lead-attendance':
      case 'team-attendance':
        return <TeamAttendance />;
      case 'meetings':
      case 'admin-meetings':
      case 'lead-meetings':
        return <Meetings />;
      case 'admin-dashboard':
        return <AdminDashboard setCurrentPage={setCurrentPage} />;
      case 'admin-timesheets':
      case 'timesheet':
      case 'lead-timesheet':
        return <AdminTimesheets />;
      case 'teams':
      case 'admin-teams':
      case 'lead-teams':
        return <Teams />;
      case 'projects':
      case 'admin-projects':
      case 'lead-projects':
        return <Projects />;
      case 'employees':
      case 'admin-employees':
        return <Employees />;
      case 'approvals':
      case 'admin-approvals':
      case 'lead-approvals':
        return <Approvals />;
      case 'lead-requests':
        return <LeadRequests />;
      case 'announcements':
      case 'admin-announcements':
      case 'lead-announcements':
        return <AdminAnnouncements />;
      case 'settings':
        return <ProfileSettings />;

      case 'alerts':
      case 'admin-alerts':
      case 'lead-alerts':
        return <Alerts setCurrentPage={setCurrentPage} />;
      case 'dashboard':
      case 'lead-dashboard':
        return <TeamLeadDashboard setCurrentPage={setCurrentPage} />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar title={getPageTitle()} currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen} />
        <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="content-body" style={{ flex: 1, overflowY: 'auto', position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-canvas)', padding: '24px' }}>
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div key={currentPage} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} style={{ width: '100%' }}>
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ThemeProvider>
            <TimerProvider>
              <MainAppContent />
            </TimerProvider>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}