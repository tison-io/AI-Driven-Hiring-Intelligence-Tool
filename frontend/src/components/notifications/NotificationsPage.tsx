'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';

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

const ITEMS_PER_PAGE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, searchNotifications } = useNotifications();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">All Notifications</h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5680D7] focus:border-transparent outline-none w-full"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
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
                  onClick={handleMarkAllAsRead}
                  className="text-[#5680D7] text-sm hover:underline"
                >
                  Mark All as Read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-[#F9FAFB] min-h-screen p-4 md:p-6">
            {paginatedNotifications.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="bg-white border border-[#E5E7EB] rounded-lg p-4 shadow-sm min-h-[120px]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
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
                            <p className="text-xs text-gray-500 mt-2">
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
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