import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from './AuthContext.jsx';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/supabaseService.js';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let subscription = null;

    const loadNotifications = async () => {
      if (!currentUser) {
        if (mounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
        return;
      }

      const { data } = await fetchNotifications();
      if (mounted && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    loadNotifications();

    if (currentUser) {
      // Subscribe to real-time inserts for the current user
      subscription = supabase
        .channel('notifications_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            if (mounted) {
              setNotifications(prev => [payload.new, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();
    }

    return () => {
      mounted = false;
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [currentUser]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
