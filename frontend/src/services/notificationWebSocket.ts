import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { Notification } from '@/types/notification.types';

class NotificationWebSocket {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;

  connect(userId: string) {
    if (this.socket?.connected) return;

    const token = Cookies.get('token');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    this.isManualDisconnect = false;
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: false, // Handle reconnection manually
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.socket?.emit('join', { userId });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      if (!this.isManualDisconnect) {
        this.handleReconnect(userId);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      if (!this.isManualDisconnect) {
        this.handleReconnect(userId);
      }
    });
  }

  private handleReconnect(userId: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.connect(userId);
    }, delay);
  }

  disconnect() {
    this.isManualDisconnect = true;
    this.socket?.disconnect();
    this.socket = null;
  }

  onNotification(callback: (notification: Notification) => void) {
    this.socket?.on('notification:new', callback);
  }

  onNotificationRead(callback: (notificationId: string) => void) {
    this.socket?.on('notification:read', callback);
  }

  onNotificationDeleted(callback: (notificationId: string) => void) {
    this.socket?.on('notification:deleted', callback);
  }

  onConnectionHealth(callback: (data: any) => void) {
    this.socket?.on('connection:health', callback);
  }

  markAsRead(notificationId: string) {
    this.socket?.emit('notification:markRead', { notificationId });
  }

  deleteNotification(notificationId: string) {
    this.socket?.emit('notification:delete', { notificationId });
  }

  requestMissedNotifications(lastReceivedAt: string) {
    this.socket?.emit('notification:getMissed', { lastReceivedAt });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  off(event: string, callback?: any) {
    this.socket?.off(event, callback);
  }
}

export const notificationWebSocket = new NotificationWebSocket();
