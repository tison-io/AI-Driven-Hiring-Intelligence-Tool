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

    // Connect WebSocket
    notificationWebSocket.connect(user._id);
    setConnected(true);

    // Fetch initial notifications
    fetchNotifications();

    // Listen for new notifications
    notificationWebSocket.onNotification((notification) => {
      addNotification(notification);
      toast.success(notification.title, {
        duration: 4000,
      });
    });

    // Listen for read notifications
    notificationWebSocket.onNotificationRead((notificationId) => {
      markAsRead(notificationId);
    });

    // Listen for deleted notifications
    notificationWebSocket.onNotificationDeleted((notificationId) => {
      deleteNotification(notificationId);
    });

    // Request missed notifications on reconnect
    const lastNotification = notifications[0];
    if (lastNotification) {
      notificationWebSocket.requestMissedNotifications(lastNotification.createdAt);
    }

    // Cleanup on unmount
    return () => {
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
