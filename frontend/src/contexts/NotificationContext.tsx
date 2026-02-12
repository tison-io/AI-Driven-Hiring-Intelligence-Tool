'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { notificationWebSocket } from '@/services/notificationWebSocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface NotificationContextType {
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  isConnected: false,
});

export const useNotificationContext = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const {
    addNotification,
    markAsRead,
    deleteNotification,
    setConnected,
    fetchNotifications,
    notifications,
  } = useNotificationStore();

  useEffect(() => {
    if (!user?._id) return;

    // Fetch initial notifications only once
    fetchNotifications();

    // Connect WebSocket
    notificationWebSocket.connect(user._id);
    setConnected(true);

    // Listen for new notifications
    const handleNotification = (notification: any) => {
      addNotification(notification);
      // Don't show toast for shortlist notifications (already shown by action)
      if (notification.type !== 'CANDIDATE_SHORTLISTED') {
        toast.success(notification.title, {
          duration: 4000,
        });
      }
    };

    // Listen for read notifications
    const handleNotificationRead = (notificationId: string) => {
      markAsRead(notificationId);
    };

    // Listen for deleted notifications
    const handleNotificationDeleted = (notificationId: string) => {
      deleteNotification(notificationId);
    };

    // Listen for missed notifications
    const handleMissedNotifications = (data: any) => {
      if (data.notifications && data.notifications.length > 0) {
        data.notifications.forEach((notification: any) => {
          addNotification(notification);
        });
      }
    };

    notificationWebSocket.onNotification(handleNotification);
    notificationWebSocket.onNotificationRead(handleNotificationRead);
    notificationWebSocket.onNotificationDeleted(handleNotificationDeleted);
    notificationWebSocket.onMissedNotifications(handleMissedNotifications);

    // Cleanup on unmount
    return () => {
      notificationWebSocket.off('notification', handleNotification);
      notificationWebSocket.off('notification:read', handleNotificationRead);
      notificationWebSocket.off('notification:deleted', handleNotificationDeleted);
      notificationWebSocket.off('missed-notifications', handleMissedNotifications);
      notificationWebSocket.disconnect();
      setConnected(false);
    };
  }, [user?._id]);

  return (
    <NotificationContext.Provider value={{ isConnected: notificationWebSocket.isConnected() }}>
      {children}
    </NotificationContext.Provider>
  );
};
