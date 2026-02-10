import { create } from 'zustand';
import { Notification, NotificationState, NotificationType } from '@/types/notification.types';
import api from '@/lib/api';

interface NotificationStore extends NotificationState {
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  setConnected: (isConnected: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  fetchNotifications: () => Promise<void>;
  filterByType: (type?: NotificationType) => Notification[];
  searchNotifications: (query: string) => Notification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: false,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  deleteNotification: (notificationId) =>
    set((state) => {
      const notification = state.notifications.find((n) => n._id === notificationId);
      return {
        notifications: state.notifications.filter((n) => n._id !== notificationId),
        unreadCount: notification && !notification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  setConnected: (isConnected) => set({ isConnected }),

  setLoading: (isLoading) => set({ isLoading }),

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/notifications');
      set({
        notifications: response.data,
        unreadCount: response.data.filter((n: Notification) => !n.isRead).length,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  filterByType: (type) => {
    const { notifications } = get();
    return type ? notifications.filter((n) => n.type === type) : notifications;
  },

  searchNotifications: (query) => {
    const { notifications } = get();
    const lowerQuery = query.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(lowerQuery) ||
        n.content.toLowerCase().includes(lowerQuery)
    );
  },
}));
