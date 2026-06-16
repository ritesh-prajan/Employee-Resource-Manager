import React, { useState, useRef, useEffect } from 'react';
import {Search, ChevronDown, LogOut, Bell, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function TopBar({ title, currentPage, setCurrentPage, isCollapsed, isMobileSidebarOpen, setIsMobileSidebarOpen }) {
  const { theme, toggleTheme, currentUser, changeUser, users, notifications = [] } = useApp();
  const { logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Resolve full profile: prefer the employee record from users[] (has name/phone/etc)
  // Fall back to currentUser itself (which may be the thin auth object right after login)
  const displayUser = users.find(u => Number(u.id) === Number(currentUser.id)) || currentUser;

  const userNotifications = notifications.filter(n => n.recipientId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleUserChange = (e) => {
    const selectedUserId = e.target.value;
    changeUser(selectedUserId);
    setShowProfileMenu(false);
    const newUser = users.find(u => u.id === selectedUserId);
    if (newUser) {
      if (newUser.role === 'Admin') setCurrentPage('admin-dashboard');
      else if (newUser.role === 'Team Lead' || newUser.role === 'Sub Lead') setCurrentPage('lead-dashboard');
      else setCurrentPage('dashboard');
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
          onClick={() => setCurrentPage('admin-dashboard')}
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
              {currentPage.startsWith('admin-') && (
                <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  admin
                </span>
              )}
              {currentPage.startsWith('lead-') && (
                <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'color-mix(in oklch, var(--primary) 10%, transparent)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  team lead
                </span>
              )}
            </>
          )}
        </div>

        {/* Search */}
        <div className="topbar-search-container" style={{ position: 'relative', marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search anything"
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
            onFocus={(e) => e.target.style.borderColor = 'var(--ring)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* Right: Accessibility, Theme, Bell, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notification Bell */}
        <button
          onClick={() => setCurrentPage(currentPage.startsWith('admin-') ? 'admin-alerts' : currentPage.startsWith('lead-') ? 'lead-alerts' : 'alerts')}
          title="Alerts"
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

              {/* Demo switcher */}
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Demo: Switch Persona
                </div>
                <select
                  value={currentUser.id}
                  onChange={handleUserChange}
                  style={{
                    width: '100%', padding: '6px', borderRadius: '6px',
                    border: '1px solid var(--border)', fontSize: '0.8rem',
                    outline: 'none', cursor: 'pointer',
                    backgroundColor: 'var(--background)', color: 'var(--foreground)'
                  }}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Settings */}
              <button
                onClick={() => { setCurrentPage('settings'); setShowProfileMenu(false); }}
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