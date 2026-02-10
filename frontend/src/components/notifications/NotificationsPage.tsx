'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, Notification } from '@/types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.PROCESSING_FAILED:
    case NotificationType.SYSTEM_ERROR:
    case NotificationType.SECURITY_ALERT:
      return '#EF4444';
    case NotificationType.CANDIDATE_SHORTLISTED:
    case NotificationType.AI_ANALYSIS_COMPLETE:
    case NotificationType.BULK_PROCESSING_COMPLETE:
      return '#0EBDC4';
    default:
      return '#5680D7';
  }
};

const ITEM_HEIGHT = 100;
const VISIBLE_ITEMS = 10;

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, searchNotifications } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    if (searchQuery) {
      filtered = searchNotifications(searchQuery);
    }
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    }
    
    return filtered;
  }, [notifications, searchQuery, filter, searchNotifications]);

  const totalHeight = filteredNotifications.length * ITEM_HEIGHT;
  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  const endIndex = Math.min(startIndex + VISIBLE_ITEMS + 2, filteredNotifications.length);
  const visibleNotifications = filteredNotifications.slice(startIndex, endIndex);
  const offsetY = startIndex * ITEM_HEIGHT;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">All Notifications</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5680D7] focus:border-transparent outline-none w-64"
            />
            </div>
          </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">All</span>
              <span className="bg-[#F3F4F6] text-gray-600 text-xs px-2 py-1 rounded-full">
                {notifications.length}
              </span>
            </button>
            
            <button
              onClick={() => setFilter('unread')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                filter === 'unread' ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">Unread</span>
              <span className="bg-[#5680D7] text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[#5680D7] text-sm hover:underline"
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Virtual Scrolling Container */}
      <div className="bg-[#F9FAFB] min-h-screen p-6">
        {filteredNotifications.length > 0 ? (
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ height: '70vh' }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              <div style={{ transform: `translateY(${offsetY}px)` }}>
                {visibleNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm mb-4"
                    style={{ height: ITEM_HEIGHT }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {!notification.isRead && (
                          <div
                            className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: getNotificationColor(notification.type) }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="text-[#5680D7] text-sm hover:underline ml-4 flex-shrink-0"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">
              {searchQuery ? 'No notifications found matching your search.' : 'No notifications yet.'}
            </p>
          </div>
        )}
      </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}