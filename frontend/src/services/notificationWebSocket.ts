import { io, Socket } from 'socket.io-client';
import { Notification } from '@/types/notification.types';
import api from '@/lib/api';

class NotificationWebSocket {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;

  async connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    // Prevent duplicate connections
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isManualDisconnect = false;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.socket = io(`${baseUrl}/notifications`, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      // Connection authenticated
    });

    this.socket.on('disconnect', () => {
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
      this.connect(userId);
    }, delay);
  }

  disconnect() {
    this.isManualDisconnect = true;
    this.socket?.disconnect();
    this.socket = null;
  }

  onNotification(callback: (notification: Notification) => void) {
    this.socket?.on('notification', callback);
  }

  onNotificationRead(callback: (notificationId: string) => void) {
    this.socket?.on('notification:read', callback);
  }

  onNotificationDeleted(callback: (notificationId: string) => void) {
    this.socket?.on('notification:deleted', callback);
  }

  onMissedNotifications(callback: (data: any) => void) {
    this.socket?.on('missed-notifications', callback);
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
