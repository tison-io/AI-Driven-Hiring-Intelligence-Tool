import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { NotificationType } from '../enums/notification-type.enum';
import { DeviceToken } from '../entities/device-token.entity';

export interface WebPushNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  icon?: string;
  badge?: string;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

@Injectable()
export class WebPushDeliveryService {
  private readonly logger = new Logger(WebPushDeliveryService.name);

  constructor(private configService: ConfigService) {
    webpush.setVapidDetails(
      'mailto:' + this.configService.get<string>('VAPID_EMAIL', 'admin@talentscan.ai'),
      this.configService.get<string>('VAPID_PUBLIC_KEY'),
      this.configService.get<string>('VAPID_PRIVATE_KEY')
    );
  }

  async sendWebPushNotification(
    deviceTokens: DeviceToken[],
    data: WebPushNotificationData
  ): Promise<{ success: number; failed: number }> {
    const webTokens = deviceTokens.filter(token => token.platform === 'WEB');
    
    if (webTokens.length === 0) {
      return { success: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: data.title,
      body: data.content,
      icon: data.icon || '/icons/notification-icon.png',
      badge: data.badge || '/icons/badge-icon.png',
      tag: `${data.type}-${data.userId}`,
      data: {
        type: data.type,
        userId: data.userId,
        metadata: data.metadata,
        timestamp: new Date().toISOString(),
        url: this.getNotificationUrl(data.type)
      },
      actions: data.actions || this.getDefaultActions(data.type),
      requireInteraction: this.isHighPriority(data.type),
      silent: false,
    });

    const results = await Promise.allSettled(
      webTokens.map(token => this.sendToDevice(token.token, payload))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.log(`Web push sent: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  private async sendToDevice(subscription: string, payload: string): Promise<void> {
    try {
      const subscriptionObject = JSON.parse(subscription);
      await webpush.sendNotification(subscriptionObject, payload);
    } catch (error) {
      this.logger.error(`Failed to send web push: ${error.message}`);
      throw error;
    }
  }

  private getNotificationUrl(type: NotificationType): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    
    const urlMap = {
      [NotificationType.NEW_APPLICATION]: '/candidates',
      [NotificationType.AI_ANALYSIS_COMPLETE]: '/candidates',
      [NotificationType.STATUS_CHANGE]: '/candidates',
      [NotificationType.CANDIDATE_SHORTLISTED]: '/candidates',
      [NotificationType.BIAS_ALERT]: '/candidates',
      [NotificationType.DUPLICATE_CANDIDATE]: '/candidates',
      [NotificationType.BULK_PROCESSING_COMPLETE]: '/dashboard',
      [NotificationType.SYSTEM_ERROR]: '/admin/dashboard',
      [NotificationType.SECURITY_ALERT]: '/admin/dashboard',
      [NotificationType.HEALTH_METRICS_ALERT]: '/admin/dashboard',
      [NotificationType.PERFORMANCE_DEGRADATION]: '/admin/dashboard',
      [NotificationType.USER_MILESTONE_REACHED]: '/admin/dashboard',
      [NotificationType.PROCESSING_MILESTONE]: '/admin/dashboard',
      [NotificationType.MONTHLY_ANALYTICS_REPORT]: '/admin/dashboard',
    };

    return `${baseUrl}${urlMap[type] || '/dashboard'}`;
  }

  private getDefaultActions(type: NotificationType): Array<{ action: string; title: string; icon?: string }> {
    const commonActions = [
      { action: 'view', title: 'View', icon: '/icons/view-icon.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/dismiss-icon.png' }
    ];

    const typeSpecificActions = {
      [NotificationType.NEW_APPLICATION]: [
        { action: 'review', title: 'Review Candidate', icon: '/icons/review-icon.png' },
        ...commonActions
      ],
      [NotificationType.AI_ANALYSIS_COMPLETE]: [
        { action: 'view-analysis', title: 'View Analysis', icon: '/icons/analysis-icon.png' },
        ...commonActions
      ],
      [NotificationType.BIAS_ALERT]: [
        { action: 'review-bias', title: 'Review Alert', icon: '/icons/warning-icon.png' },
        ...commonActions
      ],
      [NotificationType.SYSTEM_ERROR]: [
        { action: 'investigate', title: 'Investigate', icon: '/icons/investigate-icon.png' },
        ...commonActions
      ],
    };

    return typeSpecificActions[type] || commonActions;
  }

  private isHighPriority(type: NotificationType): boolean {
    const highPriorityTypes = [
      NotificationType.SYSTEM_ERROR,
      NotificationType.SECURITY_ALERT,
      NotificationType.PERFORMANCE_DEGRADATION,
      NotificationType.BIAS_ALERT,
    ];

    return highPriorityTypes.includes(type);
  }

  generateVAPIDKeys(): { publicKey: string; privateKey: string } {
    return webpush.generateVAPIDKeys();
  }
}