import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, LogOut, Bell, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title, isCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const { theme, toggleTheme, currentUser, changeUser, users, notifications = [], markNotificationRead, clearNotifications } = useApp();
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentpath = location.pathname;

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  const getSearchableItems = () => {
    const items = [];
    const isAdminView = currentUser.role === 'Admin' && !currentpath.startsWith('/lead') && currentpath !== '/dashboard' && currentpath !== '/timesheet';
    const isLeadView = (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') && !currentpath.startsWith('/admin');

    if (currentUser.role === 'Admin' && !isLeadView && currentpath !== '/dashboard' && currentpath !== '/timesheet') {
      items.push(
        { label: 'Dashboard', page: '/admin/dashboard' },
        { label: 'Employees', page: '/admin/employees' },
        { label: 'Teams', page: '/admin/teams' },
        { label: 'Projects', page: '/admin/projects' },
        { label: 'Tasks', page: '/admin/tasks' },
        { label: 'Timesheets', page: '/admin/timesheets' },
        { label: 'Approvals', page: '/admin/approvals' },
        { label: 'Feed', page: '/admin/announcements' },
        { label: 'Link Room', page: '/admin/meetings' },
        { label: 'Profile', page: '/settings' },
        { label: 'Alerts Center', page: '/alerts' }
      );
    } else if (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') {
      items.push(
        { label: 'Dashboard', page: '/lead/dashboard' },
        { label: 'Tasks', page: '/lead/tasks' },
        { label: 'Timesheet', page: '/lead/timesheet' },
        { label: 'Team Attendance', page: '/lead/attendance' },
        { label: 'Approvals', page: '/lead/approvals' },
        { label: 'My Teams', page: '/lead/teams' },
        { label: 'My Projects', page: '/lead/projects' },
        { label: 'Link Room', page: '/lead/meetings' },
        { label: 'Profile', page: '/settings' },
        { label: 'Alerts Center', page: '/alerts' }
      );
      if (currentUser.role !== 'Sub Lead') {
        items.push({ label: 'Feed', page: '/lead/announcements' });
      }
    } else {
      items.push(
        { label: 'Dashboard', page: '/dashboard' },
        { label: 'Tasks', page: '/tasks' },
        { label: 'Timesheet', page: '/timesheet' },
        { label: 'Attendance', page: '/attendance' },
        { label: 'Link Room', page: '/meetings' },
        { label: 'My Teams', page: '/teams' },
        { label: 'My Projects', page: '/projects' },
        { label: 'Feed', page: '/announcements' },
        { label: 'Profile', page: '/settings' },
        { label: 'Alerts Center', page: '/alerts' }
      );
    }
    return items;
  };

  const searchableItems = getSearchableItems();
  const matchedItems = searchQuery.trim()
    ? searchableItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  useEffect(() => {
    function handleClickOutsideSearch(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Resolve full profile: prefer the employee record from users[] (has name/phone/etc)
  // Fall back to currentUser itself (which may be the thin auth object right after login)
  const displayUser = users.find(u => 
    String(u.id) === String(currentUser?.id) || 
    (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (u.workEmail && currentUser?.email && u.workEmail.toLowerCase() === currentUser.email.toLowerCase())
  ) || currentUser;

  const userNotifications = notifications.filter(n => String(n.recipientId) === String(currentUser.id));
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleUserChange = (e) => {
    const selectedUserId = e.target.value;
    changeUser(selectedUserId);
    setShowProfileMenu(false);
    const newUser = users.find(u => u.id === selectedUserId);
    if (newUser) {
      if (newUser.role === 'Admin') navigate('/admin/dashboard');
      else if (newUser.role === 'Team Lead' || newUser.role === 'Sub Lead') navigate('/lead/dashboard');
      else navigate('/dashboard');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'var(--background)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px 0 0',
      position: 'relative',
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
      flexShrink: 0
    }}>

      {/* Left: Logo + Search */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileSidebarOpen(prev => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--foreground)',
            cursor: 'pointer',
            padding: '8px',
            marginLeft: '12px',
            marginRight: '-4px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            flexShrink: 0
          }}
        >
          <Menu size={20} />
        </button>
        {/* Logo area — mirrors sidebar width */}
        <div
          className="topbar-logo-area"
          onClick={() => {
            const logoTarget = currentUser.role === 'Admin' ? '/admin/dashboard' : (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') ? '/lead/dashboard' : '/dashboard';
            navigate(logoTarget);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: isCollapsed ? '64px' : '240px',
            paddingLeft: isCollapsed ? '0' : '24px',
            boxSizing: 'border-box',
            transition: 'width 0.25s ease, padding-left 0.25s ease',
            cursor: 'pointer',
            userSelect: 'none',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>e</span>
          {!isCollapsed && (
            <>
              <span style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>LITE</span>
              {currentpath.startsWith('/admin') && (
                <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  admin
                </span>
              )}
              {currentpath.startsWith('/lead') && (
                <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {currentUser.role === 'Sub Lead' ? 'sub lead' : 'team lead'}
                </span>
              )}
            </>
          )}
        </div>

        {/* Search */}
        <div className="topbar-search-container" ref={searchRef} style={{ position: 'relative', marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search pages (e.g. Tasks, Projects...)"
            className="topbar-search-input"
            style={{
              padding: '8px 16px 8px 36px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              outline: 'none',
              width: '260px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              transition: 'border-color 0.2s'
            }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matchedItems.length > 0) {
                navigate(matchedItems[0].page);
                setSearchQuery('');
                setShowSearchResults(false);
              }
            }}
          />
          {showSearchResults && matchedItems.length > 0 && (
            <div
              className="topbar-search-dropdown"
              style={{
                position: 'absolute',
                top: '40px',
                left: 0,
                width: '260px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 120,
                overflow: 'hidden',
                padding: '4px 0'
              }}
            >
              {matchedItems.map(item => (
                <button
                  key={item.page}
                  onClick={() => {
                    navigate(item.page);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    fontSize: '0.825rem',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Accessibility, Theme, Bell, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', borderRadius: '8px', position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                backgroundColor: '#ef4444', color: '#fff',
                fontSize: '0.6rem', fontWeight: 700,
                borderRadius: '10px', padding: '1px 4px',
                border: '1.5px solid var(--background)',
                lineHeight: 1, minWidth: '16px', textAlign: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute', right: 0, top: '40px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              width: '320px', zIndex: 110, padding: '8px 0',
              maxHeight: '400px', overflowY: 'auto'
            }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>Notifications</span>
                {userNotifications.length > 0 && (
                  <button 
                    onClick={clearNotifications}
                    style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {userNotifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    No notifications
                  </div>
                ) : (
                  userNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setShowNotifications(false);
                        if (n.entityType === 'TASK') {
                          const targetTasksPage = currentUser.role === 'Admin' ? '/admin/tasks' : (currentUser.role === 'Team Lead' || currentUser.role === 'Sub Lead') ? '/lead/tasks' : '/tasks';
                          navigate(targetTasksPage, { state: { highlightTaskId: n.entityId } });
                        } else {
                          navigate('/alerts');
                        }
                      }}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        backgroundColor: n.isRead ? 'transparent' : 'color-mix(in oklch, var(--primary) 5%, transparent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'color-mix(in oklch, var(--primary) 5%, transparent)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: n.isRead ? 600 : 700, fontSize: '0.78rem', color: 'var(--foreground)' }}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        {n.message}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--muted-foreground)', marginTop: '2px', textAlign: 'right' }}>
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', outline: 'none' }}
          >
            <div className="user-initials-badge" style={{ width: '34px', height: '34px', fontSize: '0.8rem' }}>
              {getInitials(displayUser.name)}
            </div>
            <span className="topbar-user-name" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>
              {displayUser.name || displayUser.email || 'User'}
            </span>
            <ChevronDown size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '48px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              width: '240px', zIndex: 110, padding: '8px 0'
            }}>
              {/* User info */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>{displayUser.name || displayUser.email}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', wordBreak: 'break-all' }}>{displayUser.email || currentUser.email}</div>
                <span style={{
                  display: 'inline-block', marginTop: '6px',
                  backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)',
                  color: 'var(--primary)',
                  fontSize: '0.7rem', fontWeight: 700,
                  padding: '2px 8px', borderRadius: '10px'
                }}>
                  {displayUser.role || currentUser.role}
                </span>
              </div>
              {/* Settings */}
              <button
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Account Settings
              </button>

              {/* Logout */}
              <button
                onClick={() => { logout(); setShowProfileMenu(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', color: '#ef4444', borderTop: '1px solid var(--border)', fontFamily: 'inherit', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in oklch, #ef4444 10%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}