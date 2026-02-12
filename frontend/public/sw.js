// Service Worker for Web Push Notifications
const CACHE_NAME = 'talentscan-notifications-v1';
const urlsToCache = [
  '/icons/notification-icon.png',
  '/icons/badge-icon.png',
  '/icons/view-icon.png',
  '/icons/dismiss-icon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/icons/notification-icon.png',
    badge: data.badge || '/icons/badge-icon.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [
      { action: 'view', title: 'View', icon: '/icons/view-icon.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss-icon.png' }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interactions
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  // Handle different actions
  let url = '/dashboard';
  if (data && data.url) {
    url = data.url;
  }

  // Handle specific actions
  if (action === 'view' || action === 'review' || action === 'view-analysis') {
    url = data.url || '/dashboard';
  } else if (action === 'investigate') {
    url = '/admin/system';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );

  // Send analytics event
  if (data && data.type) {
    sendNotificationAnalytics(data.type, action, data.userId);
  }
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-notifications') {
    event.waitUntil(syncOfflineNotifications());
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Helper function to sync offline notifications
async function syncOfflineNotifications() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Send message to client to sync notifications
      clients[0].postMessage({
        type: 'SYNC_OFFLINE_NOTIFICATIONS'
      });
    }
  } catch (error) {
    console.error('Failed to sync offline notifications:', error);
  }
}

// Helper function to send notification analytics
function sendNotificationAnalytics(type, action, userId) {
  try {
    fetch('/api/notifications/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        action,
        userId,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Silently fail analytics
    });
  } catch (error) {
    // Silently fail analytics
  }
}

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  const data = notification.data;

  // Send analytics for dismissed notifications
  if (data && data.type && data.userId) {
    sendNotificationAnalytics(data.type, 'dismiss', data.userId);
  }
});