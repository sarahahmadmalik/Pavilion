import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { useAuth } from './AuthContext.jsx';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../lib/supabaseService.js';
import { playNotificationChime, playChatChime } from '../lib/notificationSound.js';
import { getNotificationPreferences, showBrowserNotification } from '../lib/notificationPreferences.js';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    let chatSubscription = null;

    const loadNotifications = async () => {
      if (!currentUser) {
        if (mounted) {
          setNotifications([]);
          setUnreadCount(0);
          setChatUnreadCount(0);
        }
        return;
      }

      const { data } = await fetchNotifications();
      if (mounted && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }

      if (currentUser.role !== 'super_admin' && isSupabaseConfigured()) {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', currentUser.id)
          .is('read_at', null);
        if (mounted && typeof count === 'number') {
          setChatUnreadCount(count);
        }
      }
    };

    loadNotifications();

    if (currentUser && isSupabaseConfigured()) {
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
              const prefs = getNotificationPreferences();
              if (prefs.inAppNotifications) {
                setNotifications(prev => [payload.new, ...prev]);
                setUnreadCount(prev => prev + 1);
              }
              playNotificationChime();
              showBrowserNotification(payload.new?.title || 'PAVILION Notification', payload.new?.message || '');
            }
          }
        )
        .subscribe();

      if (currentUser.role !== 'super_admin') {
        chatSubscription = supabase
          .channel(`chat_badge_${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_messages',
              filter: `recipient_id=eq.${currentUser.id}`
            },
            async (payload) => {
              if (!mounted) return;
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', currentUser.id)
                .is('read_at', null);
              if (mounted && typeof count === 'number') {
                setChatUnreadCount(count);
              }
              if (payload.eventType === 'INSERT') {
                playChatChime();
                showBrowserNotification(
                  'New Team Message',
                  payload.new?.body || (payload.new?.attachment_name ? `Sent an attachment: ${payload.new.attachment_name}` : 'New message received')
                );
              }
            }
          )
          .subscribe();
      }
    }

    return () => {
      mounted = false;
      if (subscription) supabase.removeChannel(subscription);
      if (chatSubscription) supabase.removeChannel(chatSubscription);
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

  const clearAll = async () => {
    if (!currentUser) return;
    setNotifications([]);
    setUnreadCount(0);
    await clearAllNotifications(currentUser.id);
  };

  const refreshChatUnreadCount = async () => {
    if (!currentUser || currentUser.role === 'super_admin' || !isSupabaseConfigured()) return;
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', currentUser.id)
      .is('read_at', null);
    if (typeof count === 'number') {
      setChatUnreadCount(count);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, chatUnreadCount, refreshChatUnreadCount, markAsRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
