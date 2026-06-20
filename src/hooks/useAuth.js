/**
 * @file useAuth.js
 * @description Domain hook for user session state, credentials verification, profile merging, and login/logout actions.
 */

import { useState, useEffect, useCallback } from 'react';

export function useAuth(users = [], { onLoginSuccess, onLogout, authUser, authIsAuthenticated } = {}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [prevAuthUser, setPrevAuthUser] = useState(null);

  // Synchronize AppContext auth state with AuthContext synchronously during render
  if (authUser !== prevAuthUser) {
    setPrevAuthUser(authUser);
    setCurrentUser(authUser);
    setIsAuthenticated(authIsAuthenticated);
  }

  // Merge users details (role, departments, images) dynamically, but retain permissions from authentication session
  useEffect(() => {
    if (currentUser && (currentUser.email || currentUser.workEmail)) {
      const needle = (currentUser.email || currentUser.workEmail || '').toLowerCase();
      const match = users.find(u =>
        (u.email && u.email.toLowerCase() === needle) ||
        (u.workEmail && u.workEmail.toLowerCase() === needle)
      );
      if (match) {
        const dynamicRole = (match.role && match.role !== 'Employee') ? match.role : (authUser?.role || currentUser.role);
        const merged = {
          ...match,
          role:        dynamicRole,
          roles:       authUser?.roles       || currentUser.roles       || [],
          permissions: authUser?.permissions || currentUser.permissions || [],
          permission:  authUser?.permission  || currentUser.permission  || [],
          components:  authUser?.components  || currentUser.components  || [],
        };
        
        const isDifferent =
          merged.id !== currentUser.id ||
          merged.name !== currentUser.name ||
          merged.email !== currentUser.email ||
          merged.workEmail !== currentUser.workEmail ||
          merged.employee_code !== currentUser.employee_code ||
          merged.phone !== currentUser.phone ||
          merged.personalEmail !== currentUser.personalEmail ||
          merged.designation !== currentUser.designation ||
          merged.department !== currentUser.department ||
          merged.avatar !== currentUser.avatar ||
          merged.profileImage !== currentUser.profileImage ||
          merged.status !== currentUser.status ||
          merged.role !== currentUser.role ||
          JSON.stringify(merged.roles) !== JSON.stringify(currentUser.roles) ||
          JSON.stringify(merged.permissions) !== JSON.stringify(currentUser.permissions);

        if (isDifferent) {
          setCurrentUser(merged);
        }
      }
    }
  }, [users, currentUser, authUser]);

  const login = useCallback((email, password) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      return true;
    }
    return false;
  }, [users, onLoginSuccess]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  const forgotPassword = useCallback((email) => {
    console.log(`Password reset link sent to ${email}`);
    return true;
  }, []);

  const changeUser = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (onLogout) {
        onLogout(); // resets timer state
      }
    }
  }, [users, onLogout]);

  const verifyPassword = useCallback((userId, password) => {
    const user = users.find(u => u.id === userId);
    return user?.password === password;
  }, [users]);

  return {
    isAuthenticated,
    currentUser,
    setCurrentUser,
    setIsAuthenticated,
    login,
    logout,
    forgotPassword,
    changeUser,
    verifyPassword,
  };
}