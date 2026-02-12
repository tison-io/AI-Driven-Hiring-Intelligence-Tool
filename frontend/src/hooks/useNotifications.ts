import { useNotificationStore } from '@/stores/notificationStore';
import { notificationWebSocket } from '@/services/notificationWebSocket';
import api from '@/lib/api';
import { NotificationType } from '@/types/notification.types';

export const useNotifications = () => {
  const store = useNotificationStore();

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      store.markAsRead(notificationId);
      notificationWebSocket.markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/mark-all-read');
      store.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      store.deleteNotification(notificationId);
      notificationWebSocket.deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filterByType = (type?: NotificationType) => {
    return store.filterByType(type);
  };

  const searchNotifications = (query: string) => {
    return store.searchNotifications(query);
  };

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isConnected: store.isConnected,
    isLoading: store.isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    filterByType,
    searchNotifications,
    fetchNotifications: store.fetchNotifications,
  };
};
