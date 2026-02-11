import { useState, useEffect, useCallback } from 'react';

// VAPID public key - should match the one in your backend .env
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}

class WebPushService {
  private static instance: WebPushService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: globalThis.PushSubscription | null = null;

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Initialize service worker
  async initializeServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications are not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service Worker not available');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    try {
      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Convert to our format
      const subscriptionData: PushSubscription = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!),
        },
      };

      // Send subscription to server
      await this.sendSubscriptionToServer(userId, subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      if (success) {
        this.subscription = null;
        // Optionally notify server about unsubscription
        await this.removeSubscriptionFromServer();
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Get current subscription status
  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscription | null;
  }> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      return { isSubscribed: false, subscription: null };
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        const subscriptionData: PushSubscription = {
          endpoint: this.subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(this.subscription.getKey('auth')!),
          },
        };
        return { isSubscribed: true, subscription: subscriptionData };
      }

      return { isSubscribed: false, subscription: null };
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return { isSubscribed: false, subscription: null };
    }
  }

  // Send subscription to server
  private async sendSubscriptionToServer(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          token: JSON.stringify(subscription),
          platform: 'WEB',
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.statusText}`);
      }

      console.log('Subscription saved to server successfully');
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      // This would require the token ID, which we'd need to store locally
      // For now, we'll just log the action
      console.log('Subscription removed from client');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private getAuthToken(): string {
    // Get JWT token from localStorage or wherever you store it
    return localStorage.getItem('authToken') || '';
  }

  // Test notification
  async sendTestNotification(): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from TalentScan AI',
        icon: '/icons/notification-icon-192x192.png',
        badge: '/icons/badge-72x72.png',
      });
    }
  }
}

// React hook for using Web Push notifications
export function useWebPushNotifications(userId?: string) {
  const [state, setState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isSubscribed: false,
    subscription: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const webPushService = WebPushService.getInstance();

  // Initialize and check status
  useEffect(() => {
    const initializeAndCheckStatus = async () => {
      const isSupported = webPushService.isSupported();
      const permission = Notification.permission;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission,
      }));

      if (isSupported) {
        try {
          await webPushService.initializeServiceWorker();
          const status = await webPushService.getSubscriptionStatus();
          setState(prev => ({
            ...prev,
            isSubscribed: status.isSubscribed,
            subscription: status.subscription,
          }));
        } catch (error) {
          console.error('Failed to initialize web push:', error);
        }
      }
    };

    initializeAndCheckStatus();
  }, []);

  // Subscribe to notifications
  const subscribe = useCallback(async () => {
    if (!userId) {
      setError('User ID is required to subscribe');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const subscription = await webPushService.subscribe(userId);
      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        permission: 'granted',
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      setError(errorMessage);
      console.error('Subscription failed:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Unsubscribe from notifications
  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await webPushService.unsubscribe();
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          subscription: null,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe';
      setError(errorMessage);
      console.error('Unsubscription failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await webPushService.requestPermission();
      setState(prev => ({
        ...prev,
        permission,
      }));
      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setError(errorMessage);
      console.error('Permission request failed:', error);
      return 'denied' as NotificationPermission;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await webPushService.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }, []);

  return {
    ...state,
    loading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
  };
}

export default WebPushService;