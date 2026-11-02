import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { api, type AppNotification } from '@/api';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  refreshNotifications: async () => {},
  markAllAsRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      await api.markAllNotificationsRead();
      const list = await api.getNotifications();
      setNotifications(list);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshNotifications();

    const subscription = AppState.addEventListener('change', (nextStatus: AppStateStatus) => {
      if (nextStatus === 'active') {
        refreshNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        refreshNotifications,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
