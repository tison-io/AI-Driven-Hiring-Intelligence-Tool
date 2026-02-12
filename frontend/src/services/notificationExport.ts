import { Notification, NotificationType } from '@/types/notification.types';
import { format } from 'date-fns';

export class NotificationExportService {
  static exportToCSV(notifications: Notification[]): void {
    const headers = ['Date', 'Type', 'Title', 'Content', 'Status', 'ID'];
    const csvContent = [
      headers.join(','),
      ...notifications.map(notification => [
        format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        notification.type,
        `"${notification.title.replace(/"/g, '""')}"`,
        `"${notification.content.replace(/"/g, '""')}"`,
        notification.isRead ? 'Read' : 'Unread',
        notification._id
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'notifications.csv', 'text/csv');
  }

  static exportToJSON(notifications: Notification[]): void {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCount: notifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length,
      notifications: notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        metadata: notification.metadata
      }))
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    this.downloadFile(jsonContent, 'notifications.json', 'application/json');
  }

  static exportFilteredNotifications(
    notifications: Notification[],
    filters: {
      type?: NotificationType;
      dateRange?: { start: Date; end: Date };
      readStatus?: 'read' | 'unread' | 'all';
    }
  ): void {
    let filtered = [...notifications];

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(n => {
        const date = new Date(n.createdAt);
        return date >= filters.dateRange!.start && date <= filters.dateRange!.end;
      });
    }

    if (filters.readStatus && filters.readStatus !== 'all') {
      filtered = filtered.filter(n => 
        filters.readStatus === 'read' ? n.isRead : !n.isRead
      );
    }

    this.exportToCSV(filtered);
  }

  static generateReport(notifications: Notification[]): void {
    const report = this.generateAnalyticsReport(notifications);
    const reportContent = this.formatReportAsText(report);
    this.downloadFile(reportContent, 'notification-report.txt', 'text/plain');
  }

  private static generateAnalyticsReport(notifications: Notification[]) {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const typeStats = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dateStats = notifications.reduce((acc, n) => {
      const date = format(new Date(n.createdAt), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: { total, unread, readRate: ((total - unread) / total * 100).toFixed(1) },
      typeStats,
      dateStats,
      generatedAt: new Date().toISOString()
    };
  }

  private static formatReportAsText(report: any): string {
    return `
NOTIFICATION ANALYTICS REPORT
Generated: ${format(new Date(report.generatedAt), 'yyyy-MM-dd HH:mm:ss')}

SUMMARY
=======
Total Notifications: ${report.summary.total}
Unread Notifications: ${report.summary.unread}
Read Rate: ${report.summary.readRate}%

NOTIFICATIONS BY TYPE
====================
${Object.entries(report.typeStats)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .map(([type, count]) => `${type}: ${count}`)
  .join('\n')}

DAILY ACTIVITY
==============
${Object.entries(report.dateStats)
  .sort(([a], [b]) => b.localeCompare(a))
  .slice(0, 30) // Last 30 days
  .map(([date, count]) => `${date}: ${count}`)
  .join('\n')}
    `.trim();
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}