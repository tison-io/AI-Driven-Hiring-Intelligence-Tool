'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#5680D7] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed md:absolute left-0 md:left-auto right-0 mt-2 md:w-96 bg-[#F3F4F6] rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-[#5680D7] text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[#5680D7] text-sm hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification, index) => (
                <div
                  key={notification._id}
                  className={`p-4 ${index < recentNotifications.length - 1 ? 'border-b border-gray-300' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead && (
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: getNotificationColor(notification.type) }}
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 leading-relaxed break-words">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-300 text-center">
              <Link
                href="/notifications"
                className="text-[#5680D7] text-sm hover:underline"
                onClick={() => setIsOpen(false)}
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}