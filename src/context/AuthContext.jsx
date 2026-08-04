import React, { createContext, useContext, useState, useEffect } from 'react';
import { store, subscribeStore } from '../lib/store.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(store.getUsers());
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('mta_ghana_active_user_id');
    const allUsers = store.getUsers();
    return allUsers.find(u => u.id === saved) || allUsers[0]; // Default Super Admin
  });

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      const updatedUsers = store.getUsers();
      setUsers(updatedUsers);
      if (currentUser) {
        const refreshed = updatedUsers.find(u => u.id === currentUser.id);
        if (refreshed) setCurrentUser(refreshed);
      }
    });
    return unsubscribe;
  }, [currentUser]);

  const login = (email, password) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.status === 'Inactive') {
        return { success: false, message: 'Account is inactive. Please contact Super Admin.' };
      }
      setCurrentUser(found);
      localStorage.setItem('mta_ghana_active_user_id', found.id);
      return { success: true, user: found };
    }
    return { success: false, message: 'Invalid credentials. Please check email and password.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mta_ghana_active_user_id');
  };

  // Demo helper to quickly switch roles (Super Admin, Admin, Staff)
  const switchRole = (targetRole) => {
    const target = users.find(u => u.role === targetRole && u.status === 'Active');
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('mta_ghana_active_user_id', target.id);
    }
  };

  // Granular Permission Check
  const hasModulePermission = (moduleKey, action = 'view') => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    // Admin has access to all 6 modules & activity log, but NOT user management
    if (currentUser.role === 'admin') {
      if (moduleKey === 'user_management') return false;
      return true;
    }

    // Staff role permission evaluation
    if (currentUser.role === 'staff') {
      if (moduleKey === 'user_management' || moduleKey === 'activity_log') return false;
      const modPerms = currentUser.permissions?.[moduleKey];
      if (!modPerms) return false;
      return !!modPerms[action];
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      login,
      logout,
      switchRole,
      hasModulePermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
