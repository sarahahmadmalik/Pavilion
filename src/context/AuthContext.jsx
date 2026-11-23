import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { fetchUserProfile, fetchAllUsers, updateLastSeen } from '../lib/supabaseService.js';
import { toFriendlyError } from '../lib/errorMessages.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [authLoading, setAuthLoading] = useState(true); // initial session check
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  // Tracks the currently-loaded user id across renders, without re-subscribing
  // the auth listener below — used to ignore redundant SIGNED_IN re-emits.
  const currentUserIdRef = useRef(null);
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser]);

  // ── Presence & Last Seen Heartbeat ──────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured()) {
      setOnlineUserIds([]);
      return;
    }

    updateLastSeen(currentUser.id);
    const heartbeat = setInterval(() => updateLastSeen(currentUser.id), 60000);

    const presenceChannel = supabase.channel('online_users', {
      config: { presence: { key: currentUser.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUserIds(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      clearInterval(heartbeat);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.id]);

  // ── Bootstrap: restore session on page load ─────────────────────────────
  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return () => { mounted = false; };
    }

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
        // Supabase re-emits SIGNED_IN for the *same* session whenever the tab
        // regains focus/visibility (it silently checks/refreshes the token).
        // Without this guard, every alt-tab back into the app would flash the
        // full-page loader and re-fetch the profile for no reason.
        if (currentUserIdRef.current === session.user.id) return;
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
      return { ok: true };
    }
    return { ok: false, error };
  };

  // ── Login via Supabase Auth ──────────────────────────────────────────────
  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.' };
    }

    try {
      // Attempt Supabase Auth Login directly (avoids unauthenticated email enumeration on public.users)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return {
          success: false,
          message: toFriendlyError(error, 'Unable to sign in right now. Please check your credentials and try again.')
        };
      }
      
      const profileRes = await loadUserProfile(data.user.id);
      if (!profileRes?.ok) {
        return {
          success: false,
          message: 'Signed in, but your user profile could not be loaded. Please ensure database RLS policies are applied.'
        };
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

    // Staff: full access to every operational module by default — Activity Log
    // and User Management are always off-limits. An admin/super_admin can
    // still restrict specific modules/actions per person via the permission
    // matrix in User Management; only an explicit override (a stored row)
    // narrows access below the full-access default.
    if (currentUser.role === 'staff') {
      if (moduleKey === 'user_management' || moduleKey === 'activity_log') return false;
      const override = currentUser.permissions?.[moduleKey];
      if (!override) return true;
      return !!override[action];
    }

    return false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      users,
      onlineUserIds,
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
