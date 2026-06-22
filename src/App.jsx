import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import { Route, Routes, Navigate, useNavigate, useLocation,Outlet } from 'react-router-dom';
import Forgotpassword from './pages/Forgotpassword.jsx';
import Resetpassword from './pages/Resetpassword.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalLoader from './components/GlobalLoader';

// Employee Pages (Lazy Loaded)
const Tasks = React.lazy(() => import('./pages/employee/Tasks'));
const Attendance = React.lazy(() => import('./pages/employee/Attendance'));
const Meetings = React.lazy(() => import('./pages/employee/Meetings'));
const EmployeeDashboard = React.lazy(() => import('./pages/employee/Dashboard'));

// Team Lead / Sub Lead Pages (Lazy Loaded)
const TeamAttendance = React.lazy(() => import('./pages/lead/TeamAttendance'));
const LeadRequests = React.lazy(() => import('./pages/lead/Requests'));
const TeamLeadDashboard = React.lazy(() => import('./pages/lead/TeamLeadDashboard'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Teams = React.lazy(() => import('./pages/admin/Teams'));
const Projects = React.lazy(() => import('./pages/admin/Projects'));
const Employees = React.lazy(() => import('./pages/admin/Employees'));
const Approvals = React.lazy(() => import('./pages/admin/Approvals'));
const AdminAnnouncements = React.lazy(() => import('./pages/admin/Announcements'));
const AdminTimesheets = React.lazy(() => import('./pages/admin/Timesheets'));

// Shared / Settings Pages (Lazy Loaded)
const Alerts = React.lazy(() => import('./pages/Alerts'));
const ProfileSettings = React.lazy(() => import('./pages/ProfileSettings'));

// Page titles keyed by real path
const PAGE_TITLES = {
  '/dashboard': 'Time Tracker',
  '/lead/dashboard': 'Time Tracker',
  '/admin/dashboard': 'Dashboard',
  '/timesheet': 'Timesheet',
  '/lead/timesheet': 'Timesheet',
  '/admin/timesheets': 'Timesheets',
  '/tasks': 'Tasks',
  '/admin/tasks': 'Tasks',
  '/lead/tasks': 'Tasks',
  '/backlog': 'Backlog',
  '/admin/backlog': 'Backlog',
  '/lead/backlog': 'Backlog',
  '/attendance': 'Attendance',
  '/lead/attendance': 'Team Attendance',
  '/meetings': 'Link Room',
  '/admin/meetings': 'Link Room',
  '/lead/meetings': 'Link Room',
  '/teams': 'My Teams',
  '/admin/teams': 'Teams',
  '/lead/teams': 'My Teams',
  '/projects': 'My Projects',
  '/admin/projects': 'Projects',
  '/lead/projects': 'My Projects',
  '/admin/employees': 'Employees',
  '/admin/approvals': 'Approvals',
  '/lead/approvals': 'Approvals',
  '/lead/requests': 'Requests',
  '/announcements': 'Announcements',
  '/admin/announcements': 'Announcements',
  '/lead/announcements': 'Announcements',
  '/settings': 'Profile',
  '/alerts': 'Alerts Center',
  '/admin/alerts': 'Alerts Center',
  '/lead/alerts': 'Alerts Center',
};

// Which paths each role is allowed to be on
const ADMIN_ROUTES = [
  '/admin/dashboard', '/admin/timesheets', '/admin/tasks', '/admin/backlog',
  '/admin/teams', '/admin/projects', '/admin/employees', '/admin/approvals',
  '/admin/announcements', '/admin/meetings', '/admin/alerts', '/settings',
];
const LEAD_ROUTES = [
  '/lead/dashboard', '/lead/timesheet', '/lead/tasks', '/lead/backlog',
  '/lead/attendance', '/lead/projects', '/lead/approvals', '/lead/requests',
  '/lead/announcements', '/lead/meetings', '/lead/teams', '/lead/alerts', '/settings',
];
const EMPLOYEE_ROUTES = [
  '/dashboard', '/timesheet', '/tasks', '/backlog', '/attendance', '/meetings',
  '/teams', '/projects', '/announcements', '/alerts', '/settings',
];

function ProtectedRoute({allowedRoles}){
  const {user:currentUser,isAuthenticated}=useAuth();
  if(!isAuthenticated){
    return <Navigate to="/login" replace/>
  }
  if(allowedRoles&&!allowedRoles.includes(currentUser.role)){
    const isadmin=currentUser.role==='Admin';
    const islead=currentUser.role==='Team Lead'|| currentUser.role==='Sub Lead';
    const home=isadmin?'/admin/dashboard':islead?'/lead/dashboard':'/dashboard';
    return <Navigate to ={home} replace/>
  }
  return <Outlet/>
}

function MainAppContent() {
  const { user: currentUser, isAuthenticated, loading } = useAuth();
  const [prevUserId, setPrevUserId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Role-based redirect: send to home page on login, and guard against
  // a user manually visiting a path outside their role's allowed routes.
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setPrevUserId(null);
      return;
    }
    if(prevUserId!==currentUser.id){
      setPrevUserId(currentUser.id);
      const isadmin=currentUser.role==='Admin';
      const islead=currentUser.role==='Team Lead'||currentUser.role==='Sub Lead'
      if(isadmin) navigate('/admin/dashboard',{replace:true})
      if(islead) navigate('/lead/dashboard',{replace:true})
      else navigate('/dashboard',{replace:true})
    }

    
  }, [currentUser, isAuthenticated,prevUserId, navigate]);

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

  const pageTitle = PAGE_TITLES[location.pathname] || 'Elite';

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar title={pageTitle} isCollapsed={isCollapsed} isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileSidebarOpen={isMobileSidebarOpen} setIsMobileSidebarOpen={setIsMobileSidebarOpen} />
        {isMobileSidebarOpen && (
          <div
            className="mobile-sidebar-backdrop"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="content-body" style={{ flex: 1, overflowY: 'auto', position: 'relative', overflowX: 'hidden', backgroundColor: 'var(--bg-canvas)', padding: '24px' }}>
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }} style={{ width: '100%' }}>
                  <Suspense fallback={<GlobalLoader />}>
                    <Routes>
                      {/* Admin section */}
                      <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']} />}>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="backlog" element={<Tasks initialScope="backlog" />} />
                        <Route path="timesheets" element={<AdminTimesheets />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="employees" element={<Employees />} />
                        <Route path="approvals" element={<Approvals />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                        <Route path="meetings" element={<Meetings />} />
                      </Route>

                      {/* Team Lead / Sub Lead section */}
                      <Route path="/lead" element={<ProtectedRoute allowedRoles={['Team Lead', 'Sub Lead']} />}>
                        <Route path="dashboard" element={<TeamLeadDashboard />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="backlog" element={<Tasks initialScope="backlog" />} />
                        <Route path="timesheet" element={<AdminTimesheets />} />
                        <Route path="attendance" element={<TeamAttendance />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="approvals" element={<LeadRequests />} />
                        <Route path="requests" element={<LeadRequests />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                        <Route path="meetings" element={<Meetings />} />
                      </Route>

                      {/* Employee section (no prefix) */}
                      <Route path="/" element={<ProtectedRoute allowedRoles={['Employee']} />}>
                        <Route path="dashboard" element={<EmployeeDashboard />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="backlog" element={<Tasks initialScope="backlog" />} />
                        <Route path="timesheet" element={<AdminTimesheets />} />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="meetings" element={<Meetings />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="announcements" element={<AdminAnnouncements />} />
                      </Route>

                      {/* Shared, any authenticated role */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/settings" element={<ProfileSettings />} />
                        <Route path="/alerts" element={<Alerts />} />
                      </Route>

                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                                      </Suspense>
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