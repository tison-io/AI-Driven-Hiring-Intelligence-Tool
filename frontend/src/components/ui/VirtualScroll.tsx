'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Specialized virtual scroll for notifications
interface NotificationVirtualScrollProps {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const NotificationVirtualScroll: React.FC<NotificationVirtualScrollProps> = ({
  notifications,
  onMarkAsRead,
  onDelete,
  className = ''
}) => {
  const renderNotificationItem = (notification: any, index: number) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 leading-relaxed">
              {notification.content}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="text-blue-600 text-sm hover:underline"
            >
              Mark as Read
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(notification._id)}
              className="text-red-600 text-sm hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <VirtualScroll
      items={notifications}
      itemHeight={120} // Approximate height of each notification item
      containerHeight={600} // Container height
      renderItem={renderNotificationItem}
      overscan={3}
      className={className}
    />
  );
};