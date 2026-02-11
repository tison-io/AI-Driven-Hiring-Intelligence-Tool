'use client';

// Web Push Service for Frontend
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPermissionResult {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

class WebPushService {
  private vapidPublicKey: string;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  }

  // Initialize service worker and push notifications
  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return false;
    }

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Set up message listener
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      console.log('Web Push Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Web Push Service:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermissionResult> {
    if (!('Notification' in window)) {
      return { granted: false, denied: true, default: false };
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    const result = {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };

    if (result.granted) {
      toast.success('Notifications enabled successfully!');
    } else if (result.denied) {
      toast.error('Notifications blocked. Please enable them in browser settings.');
    }

    return result;
  }

  // Subscribe to push notifications
  async subscribe(userId: string): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Check if already subscribed
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!this.pushSubscription) {
        // Create new subscription
        this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }

      const subscriptionData = this.extractSubscriptionData(this.pushSubscription);
      
      // Register with backend
      await this.registerSubscriptionWithBackend(userId, subscriptionData);

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      toast.error('Failed to enable push notifications');
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId: string): Promise<boolean> {
    if (!this.pushSubscription) {
      return true;
    }

    try {
      await this.pushSubscription.unsubscribe();
      
      // Unregister with backend
      await this.unregisterSubscriptionWithBackend(userId);
      
      this.pushSubscription = null;
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return !!this.pushSubscription;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return this.pushSubscription ? this.extractSubscriptionData(this.pushSubscription) : null;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Show local notification (fallback)
  showLocalNotification(title: string, options: NotificationOptions = {}): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      icon: '/icons/notification-icon.png',
      badge: '/icons/badge-icon.png',
      ...options
    });

    // Auto-close after 5 seconds if not interacted with
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event;

    switch (data.type) {
      case 'SYNC_OFFLINE_NOTIFICATIONS':
        this.syncOfflineNotifications();
        break;
      default:
        break;
    }
  }

  // Sync offline notifications
  private async syncOfflineNotifications(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/queue/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const notifications = await response.json();
        
        // Show local notifications for queued items
        notifications.forEach((notification: any) => {
          this.showLocalNotification(notification.title, {
            body: notification.content,
            data: {
              type: notification.type,
              userId: notification.userId,
              metadata: notification.metadata
            }
          });
        });

        if (notifications.length > 0) {
          toast.success(`Synced ${notifications.length} offline notifications`);
        }
      }
    } catch (error) {
      console.error('Failed to sync offline notifications:', error);
    }
  }

  // Register subscription with backend
  private async registerSubscriptionWithBackend(userId: string, subscription: PushSubscriptionData): Promise<void> {
    const response = await fetch('/api/notifications/device-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: JSON.stringify(subscription),
        platform: 'WEB',
        userAgent: navigator.userAgent
      })
    });

    if (!response.ok) {
      throw new Error('Failed to register push subscription');
    }
  }

  // Unregister subscription with backend
  private async unregisterSubscriptionWithBackend(userId: string): Promise<void> {
    const tokens = await this.getActiveDeviceTokens();
    const webTokens = tokens.filter((token: any) => token.platform === 'WEB');

    for (const token of webTokens) {
      await fetch(`/api/notifications/device-tokens/${token._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    }
  }

  // Get active device tokens
  private async getActiveDeviceTokens(): Promise<any[]> {
    try {
      const response = await fetch('/api/notifications/device-tokens/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to get active device tokens:', error);
      return [];
    }
  }

  // Extract subscription data
  private extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: key ? this.arrayBufferToBase64(key) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : ''
      }
    };
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

  // Convert ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Test push notification
  async testNotification(): Promise<void> {
    this.showLocalNotification('Test Notification', {
      body: 'This is a test notification from TalentScan AI',
      icon: '/icons/notification-icon.png',
      tag: 'test-notification',
      requireInteraction: false
    });
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }
}

// Export singleton instance
export const webPushService = new WebPushService();

// React hook for using web push service
export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeService = async () => {
      const supported = webPushService.isSupported();
      setIsSupported(supported);

      if (supported) {
        await webPushService.initialize();
        const subscribed = await webPushService.isSubscribed();
        setIsSubscribed(subscribed);
        setPermission(webPushService.getPermissionStatus());
      }
    };

    initializeService();
  }, []);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await webPushService.requestPermission();
      setPermission(result.granted ? 'granted' : result.denied ? 'denied' : 'default');
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async (userId: string) => {
    setIsLoading(true);
    try {
      const subscription = await webPushService.subscribe(userId);
      setIsSubscribed(!!subscription);
      return subscription;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async (userId: string) => {
    setIsLoading(true);
    try {
      const success = await webPushService.unsubscribe(userId);
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = () => {
    webPushService.testNotification();
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification
  };
}

export default webPushService;