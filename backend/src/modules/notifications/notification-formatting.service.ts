import { Injectable } from '@nestjs/common';
import { NotificationType } from './enums/notification-type.enum';
import { DevicePlatform } from './entities/device-token.entity';

export interface NotificationData {
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  userId: string;
}

export interface FormattedNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  sound?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  priority?: 'low' | 'normal' | 'high';
  category?: string;
}

@Injectable()
export class NotificationFormattingService {
  
  formatForPlatform(
    notification: NotificationData,
    platform: DevicePlatform
  ): FormattedNotification {
    switch (platform) {
      case DevicePlatform.WEB:
        return this.formatForWeb(notification);
      case DevicePlatform.ANDROID:
        return this.formatForAndroid(notification);
      case DevicePlatform.IOS:
        return this.formatForIOS(notification);
      default:
        return this.formatDefault(notification);
    }
  }

  private formatForWeb(notification: NotificationData): FormattedNotification {
    const typeConfig = this.getTypeConfiguration(notification.type);
    
    return {
      title: this.truncateText(notification.title, 50),
      body: this.truncateText(notification.content, 120),
      icon: typeConfig.webIcon,
      badge: '/icons/badge-96x96.png',
      data: {
        type: notification.type,
        userId: notification.userId,
        metadata: notification.metadata,
        url: this.getNotificationUrl(notification.type),
        timestamp: new Date().toISOString(),
      },
      actions: this.getWebActions(notification.type),
      priority: typeConfig.priority,
    };
  }

  private formatForAndroid(notification: NotificationData): FormattedNotification {
    const typeConfig = this.getTypeConfiguration(notification.type);
    
    return {
      title: this.truncateText(notification.title, 65),
      body: this.truncateText(notification.content, 240),
      icon: typeConfig.androidIcon,
      sound: typeConfig.sound,
      data: {
        type: notification.type,
        userId: notification.userId,
        metadata: notification.metadata,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        route: this.getMobileRoute(notification.type),
      },
      priority: typeConfig.priority,
      category: typeConfig.category,
    };
  }

  private formatForIOS(notification: NotificationData): FormattedNotification {
    const typeConfig = this.getTypeConfiguration(notification.type);
    
    return {
      title: this.truncateText(notification.title, 60),
      body: this.truncateText(notification.content, 178),
      sound: typeConfig.sound,
      badge: this.getBadgeCount(notification.userId),
      data: {
        type: notification.type,
        userId: notification.userId,
        metadata: notification.metadata,
        route: this.getMobileRoute(notification.type),
      },
      priority: typeConfig.priority,
      category: typeConfig.category,
    };
  }

  private formatDefault(notification: NotificationData): FormattedNotification {
    return {
      title: notification.title,
      body: notification.content,
      data: {
        type: notification.type,
        userId: notification.userId,
        metadata: notification.metadata,
      },
      priority: 'normal',
    };
  }

  private getTypeConfiguration(type: NotificationType) {
    const configs = {
      [NotificationType.NEW_APPLICATION]: {
        webIcon: '/icons/new-application.png',
        androidIcon: 'ic_new_application',
        sound: 'notification_sound.mp3',
        priority: 'high' as const,
        category: 'candidate_management',
      },
      [NotificationType.AI_ANALYSIS_COMPLETE]: {
        webIcon: '/icons/ai-analysis.png',
        androidIcon: 'ic_ai_analysis',
        sound: 'analysis_complete.mp3',
        priority: 'normal' as const,
        category: 'processing',
      },
      [NotificationType.STATUS_CHANGE]: {
        webIcon: '/icons/status-change.png',
        androidIcon: 'ic_status_change',
        sound: 'status_update.mp3',
        priority: 'normal' as const,
        category: 'candidate_management',
      },
      [NotificationType.CANDIDATE_SHORTLISTED]: {
        webIcon: '/icons/shortlisted.png',
        androidIcon: 'ic_shortlisted',
        sound: 'success_sound.mp3',
        priority: 'high' as const,
        category: 'candidate_management',
      },
      [NotificationType.BIAS_ALERT]: {
        webIcon: '/icons/bias-alert.png',
        androidIcon: 'ic_bias_alert',
        sound: 'alert_sound.mp3',
        priority: 'high' as const,
        category: 'alerts',
      },
      [NotificationType.DUPLICATE_CANDIDATE]: {
        webIcon: '/icons/duplicate.png',
        androidIcon: 'ic_duplicate',
        sound: 'notification_sound.mp3',
        priority: 'normal' as const,
        category: 'candidate_management',
      },
      [NotificationType.BULK_PROCESSING_COMPLETE]: {
        webIcon: '/icons/bulk-complete.png',
        androidIcon: 'ic_bulk_complete',
        sound: 'completion_sound.mp3',
        priority: 'normal' as const,
        category: 'processing',
      },
      [NotificationType.SYSTEM_ERROR]: {
        webIcon: '/icons/system-error.png',
        androidIcon: 'ic_system_error',
        sound: 'error_sound.mp3',
        priority: 'high' as const,
        category: 'system_alerts',
      },
      [NotificationType.SECURITY_ALERT]: {
        webIcon: '/icons/security-alert.png',
        androidIcon: 'ic_security_alert',
        sound: 'security_alert.mp3',
        priority: 'high' as const,
        category: 'security',
      },
      [NotificationType.HEALTH_METRICS_ALERT]: {
        webIcon: '/icons/health-metrics.png',
        androidIcon: 'ic_health_metrics',
        sound: 'alert_sound.mp3',
        priority: 'normal' as const,
        category: 'system_alerts',
      },
      [NotificationType.PERFORMANCE_DEGRADATION]: {
        webIcon: '/icons/performance.png',
        androidIcon: 'ic_performance',
        sound: 'alert_sound.mp3',
        priority: 'high' as const,
        category: 'system_alerts',
      },
      [NotificationType.USER_MILESTONE_REACHED]: {
        webIcon: '/icons/milestone.png',
        androidIcon: 'ic_milestone',
        sound: 'celebration_sound.mp3',
        priority: 'normal' as const,
        category: 'milestones',
      },
      [NotificationType.PROCESSING_MILESTONE]: {
        webIcon: '/icons/processing-milestone.png',
        androidIcon: 'ic_processing_milestone',
        sound: 'milestone_sound.mp3',
        priority: 'normal' as const,
        category: 'milestones',
      },
      [NotificationType.MONTHLY_ANALYTICS_REPORT]: {
        webIcon: '/icons/analytics-report.png',
        androidIcon: 'ic_analytics_report',
        sound: 'notification_sound.mp3',
        priority: 'low' as const,
        category: 'reports',
      },
      [NotificationType.PROCESSING_FAILED]: {
        webIcon: '/icons/processing-failed.png',
        androidIcon: 'ic_processing_failed',
        sound: 'error_sound.mp3',
        priority: 'high' as const,
        category: 'processing',
      },
    };

    return configs[type] || {
      webIcon: '/icons/default-notification.png',
      androidIcon: 'ic_notification',
      sound: 'notification_sound.mp3',
      priority: 'normal' as const,
      category: 'general',
    };
  }

  private getWebActions(type: NotificationType): Array<{ action: string; title: string; icon?: string }> {
    const commonActions = [
      { action: 'view', title: 'View', icon: '/icons/view-action.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss-action.png' },
    ];

    const typeSpecificActions = {
      [NotificationType.NEW_APPLICATION]: [
        { action: 'review', title: 'Review Now', icon: '/icons/review-action.png' },
        ...commonActions,
      ],
      [NotificationType.AI_ANALYSIS_COMPLETE]: [
        { action: 'view-analysis', title: 'View Analysis', icon: '/icons/analysis-action.png' },
        ...commonActions,
      ],
      [NotificationType.BIAS_ALERT]: [
        { action: 'investigate', title: 'Investigate', icon: '/icons/investigate-action.png' },
        ...commonActions,
      ],
      [NotificationType.SYSTEM_ERROR]: [
        { action: 'investigate', title: 'Investigate', icon: '/icons/investigate-action.png' },
        { action: 'acknowledge', title: 'Acknowledge', icon: '/icons/ack-action.png' },
      ],
    };

    return typeSpecificActions[type] || commonActions;
  }

  private getNotificationUrl(type: NotificationType): string {
    const urlMap = {
      [NotificationType.NEW_APPLICATION]: '/candidates',
      [NotificationType.AI_ANALYSIS_COMPLETE]: '/candidates',
      [NotificationType.STATUS_CHANGE]: '/candidates',
      [NotificationType.CANDIDATE_SHORTLISTED]: '/candidates',
      [NotificationType.BIAS_ALERT]: '/candidates',
      [NotificationType.DUPLICATE_CANDIDATE]: '/candidates',
      [NotificationType.BULK_PROCESSING_COMPLETE]: '/dashboard',
      [NotificationType.SYSTEM_ERROR]: '/admin/system',
      [NotificationType.SECURITY_ALERT]: '/admin/security',
      [NotificationType.HEALTH_METRICS_ALERT]: '/admin/health',
      [NotificationType.PERFORMANCE_DEGRADATION]: '/admin/performance',
      [NotificationType.USER_MILESTONE_REACHED]: '/admin/analytics',
      [NotificationType.PROCESSING_MILESTONE]: '/admin/analytics',
      [NotificationType.MONTHLY_ANALYTICS_REPORT]: '/admin/reports',
      [NotificationType.PROCESSING_FAILED]: '/dashboard',
    };

    return urlMap[type] || '/dashboard';
  }

  private getMobileRoute(type: NotificationType): string {
    const routeMap = {
      [NotificationType.NEW_APPLICATION]: '/candidates',
      [NotificationType.AI_ANALYSIS_COMPLETE]: '/candidates',
      [NotificationType.STATUS_CHANGE]: '/candidates',
      [NotificationType.CANDIDATE_SHORTLISTED]: '/candidates',
      [NotificationType.BIAS_ALERT]: '/candidates',
      [NotificationType.DUPLICATE_CANDIDATE]: '/candidates',
      [NotificationType.BULK_PROCESSING_COMPLETE]: '/dashboard',
      [NotificationType.SYSTEM_ERROR]: '/admin/system',
      [NotificationType.SECURITY_ALERT]: '/admin/security',
      [NotificationType.HEALTH_METRICS_ALERT]: '/admin/health',
      [NotificationType.PERFORMANCE_DEGRADATION]: '/admin/performance',
      [NotificationType.USER_MILESTONE_REACHED]: '/admin/analytics',
      [NotificationType.PROCESSING_MILESTONE]: '/admin/analytics',
      [NotificationType.MONTHLY_ANALYTICS_REPORT]: '/admin/reports',
      [NotificationType.PROCESSING_FAILED]: '/dashboard',
    };

    return routeMap[type] || '/dashboard';
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private getBadgeCount(userId: string): string {
    // This would typically fetch from a service that tracks unread counts
    // For now, return a placeholder
    return '1';
  }

  formatEmailSubject(type: NotificationType, title: string): string {
    const prefixes = {
      [NotificationType.SYSTEM_ERROR]: '🚨 Critical Error',
      [NotificationType.SECURITY_ALERT]: '🔒 Security Alert',
      [NotificationType.PERFORMANCE_DEGRADATION]: '⚠️ Performance Alert',
      [NotificationType.HEALTH_METRICS_ALERT]: '📊 Health Alert',
      [NotificationType.BIAS_ALERT]: '⚖️ Bias Alert',
      [NotificationType.NEW_APPLICATION]: '📋 New Application',
      [NotificationType.CANDIDATE_SHORTLISTED]: '⭐ Candidate Shortlisted',
      [NotificationType.BULK_PROCESSING_COMPLETE]: '✅ Processing Complete',
      [NotificationType.MONTHLY_ANALYTICS_REPORT]: '📈 Monthly Report',
    };

    const prefix = prefixes[type] || '📢 Notification';
    return `${prefix}: ${title}`;
  }

  formatSMSContent(notification: NotificationData): string {
    const maxLength = 160; // SMS character limit
    const prefix = this.getSMSPrefix(notification.type);
    const availableLength = maxLength - prefix.length - 3; // 3 for "..."
    
    let content = `${prefix} ${notification.content}`;
    
    if (content.length > maxLength) {
      content = content.substring(0, maxLength - 3) + '...';
    }
    
    return content;
  }

  private getSMSPrefix(type: NotificationType): string {
    const prefixes = {
      [NotificationType.SYSTEM_ERROR]: '[CRITICAL]',
      [NotificationType.SECURITY_ALERT]: '[SECURITY]',
      [NotificationType.PERFORMANCE_DEGRADATION]: '[ALERT]',
      [NotificationType.BIAS_ALERT]: '[BIAS]',
      [NotificationType.NEW_APPLICATION]: '[NEW]',
      [NotificationType.CANDIDATE_SHORTLISTED]: '[SHORTLIST]',
    };

    return prefixes[type] || '[INFO]';
  }
}