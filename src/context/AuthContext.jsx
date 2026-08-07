import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { fetchUserProfile, fetchAllUsers } from '../lib/supabaseService.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [authLoading, setAuthLoading] = useState(true); // initial session check

  // ── Bootstrap: restore session on page load ─────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthLoading(true);
        await loadUserProfile(session.user.id);
        if (mounted) setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setUsers([]);
        if (mounted) setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUserId) => {
    const { data, error } = await fetchUserProfile(authUserId);
    if (!error && data) {
      setCurrentUser(data);
      // Load all users for admin/super-admin panels
      if (data.role !== 'staff') {
        const { data: allUsers } = await fetchAllUsers();
        setUsers(allUsers || []);
      }
    }
  };

  // ── Login via Supabase Auth ──────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      // 1. Pre-check if email exists in public.users
      const { data: userRecords, error: checkErr } = await supabase
        .from('users')
        .select('email, role, id')
        .ilike('email', email);
        
      if (!checkErr && (!userRecords || userRecords.length === 0)) {
        return { success: false, message: 'Account with this email does not exist.' };
      }

      // 2. Attempt Supabase Auth Login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        let msg = error.message;
        if (typeof msg === 'object') msg = 'Invalid credentials.';
        
        // Handle specific Supabase Auth errors
        if (error.status === 500) {
           msg = 'Server Error (500): The authentication database is currently unreachable or corrupted.';
        } else if (msg === '{}' || msg === '[object Object]' || !msg || msg.includes('Invalid login credentials')) {
           msg = 'Invalid password. Please try again.';
        } else if (msg === 'Failed to fetch') {
           msg = 'Network error: Cannot connect to authentication server.';
        }
        return { success: false, message: msg };
      }
      
      // 3. Permissions check
      if (data?.user) {
        const { data: profile } = await fetchUserProfile(data.user.id);
        if (profile && profile.role === 'staff') {
           // Verify they have at least one permission
           const perms = profile.permissions;
           if (!perms || Object.keys(perms).length === 0) {
              await supabase.auth.signOut();
              return { success: false, message: 'Your account has no permissions set up. Please contact an administrator.' };
           }
        }
      }

      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, message: 'An unexpected error occurred during login.' };
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUsers([]);
  };

  // ── Refresh users list (call after user CRUD) ────────────────────────────
  const refreshUsers = async () => {
    const { data } = await fetchAllUsers();
    setUsers(data || []);
  };

  // ── Refresh own profile ──────────────────────────────────────────────────
  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await loadUserProfile(session.user.id);
  };

  // ── Granular permission check ────────────────────────────────────────────
  const hasModulePermission = (moduleKey, action = 'view') => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;

    // Admin: all modules except user_management
    if (currentUser.role === 'admin') {
      if (moduleKey === 'user_management') return false;
      return true;
    }

    // Staff: check per-module permissions
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
      authLoading,
      login,
      logout,
      refreshUsers,
      refreshProfile,
      hasModulePermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
