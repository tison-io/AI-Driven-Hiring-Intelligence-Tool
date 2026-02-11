import { Injectable, Logger } from '@nestjs/common';
import { EmailDeliveryService, EmailNotificationData } from './delivery/email-delivery.service';
import { WebPushDeliveryService, WebPushNotificationData } from './delivery/web-push-delivery.service';
import { OfflineQueueService, QueuedNotification } from './delivery/offline-queue.service';
import { DeviceTokenManagementService } from './device-token-management.service';
import { NotificationFormattingService, NotificationData } from './notification-formatting.service';
import { ConnectionStateService } from './connection-state.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType } from './enums/notification-type.enum';
import { DevicePlatform } from './entities/device-token.entity';

export interface DeliveryOptions {
  userId: string;
  userEmail?: string;
  notification: NotificationData;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels?: ('websocket' | 'email' | 'push' | 'queue')[];
}

export interface DeliveryResult {
  websocket: { success: boolean; error?: string };
  email: { success: boolean; error?: string };
  push: { success: number; failed: number; error?: string };
  queue: { success: boolean; error?: string };
}

@Injectable()
export class MultiChannelDeliveryService {
  private readonly logger = new Logger(MultiChannelDeliveryService.name);

  constructor(
    private emailDeliveryService: EmailDeliveryService,
    private webPushDeliveryService: WebPushDeliveryService,
    private offlineQueueService: OfflineQueueService,
    private deviceTokenManagementService: DeviceTokenManagementService,
    private notificationFormattingService: NotificationFormattingService,
    private connectionStateService: ConnectionStateService,
    private notificationGateway: NotificationGateway,
  ) {}

  async deliverNotification(options: DeliveryOptions): Promise<DeliveryResult> {
    const result: DeliveryResult = {
      websocket: { success: false },
      email: { success: false },
      push: { success: 0, failed: 0 },
      queue: { success: false },
    };

    const channels = options.channels || this.getDefaultChannels(options.priority, options.notification.type);
    const isUserOnline = this.notificationGateway.isUserConnected(options.userId);

    // WebSocket delivery (if user is online)
    if (channels.includes('websocket') && isUserOnline) {
      result.websocket = await this.deliverViaWebSocket(options);
    }

    // Email delivery (for critical alerts or when user is offline)
    if (channels.includes('email') && this.shouldSendEmail(options.priority, options.notification.type, isUserOnline)) {
      result.email = await this.deliverViaEmail(options);
    }

    // Push notification delivery
    if (channels.includes('push')) {
      result.push = await this.deliverViaPush(options);
    }

    // Queue for offline users
    if (channels.includes('queue') && !isUserOnline) {
      result.queue = await this.queueForOfflineUser(options);
    }

    this.logDeliveryResult(options, result);
    return result;
  }

  private async deliverViaWebSocket(options: DeliveryOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const notificationId = options.notification.metadata?.notificationId;
      if (!notificationId) {
        this.logger.warn('No notification ID provided for WebSocket delivery');
        return { success: false, error: 'No notification ID' };
      }
      
      await this.notificationGateway.broadcastToUser(options.userId, {
        _id: notificationId,
        userId: options.userId,
        type: options.notification.type,
        title: options.notification.title,
        content: options.notification.content,
        metadata: options.notification.metadata,
        createdAt: new Date(),
      } as any);
      return { success: true };
    } catch (error) {
      this.logger.error(`WebSocket delivery failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async deliverViaEmail(options: DeliveryOptions): Promise<{ success: boolean; error?: string }> {
    if (!options.userEmail) {
      return { success: false, error: 'User email not provided' };
    }

    try {
      const emailData: EmailNotificationData = {
        userId: options.userId,
        userEmail: options.userEmail,
        type: options.notification.type,
        title: options.notification.title,
        content: options.notification.content,
        metadata: options.notification.metadata,
        priority: options.priority,
      };

      const success = await this.emailDeliveryService.sendCriticalAlert(emailData);
      return { success };
    } catch (error) {
      this.logger.error(`Email delivery failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async deliverViaPush(options: DeliveryOptions): Promise<{ success: number; failed: number; error?: string }> {
    try {
      const deviceTokens = await this.deviceTokenManagementService.getActiveTokensForUser(options.userId);
      
      if (deviceTokens.length === 0) {
        return { success: 0, failed: 0, error: 'No active device tokens' };
      }

      // Group tokens by platform and send formatted notifications
      const results = { success: 0, failed: 0 };

      for (const platform of [DevicePlatform.WEB, DevicePlatform.ANDROID, DevicePlatform.IOS]) {
        const platformTokens = deviceTokens.filter(token => token.platform === platform);
        
        if (platformTokens.length === 0) continue;

        const formattedNotification = this.notificationFormattingService.formatForPlatform(
          options.notification,
          platform
        );

        if (platform === DevicePlatform.WEB) {
          const webPushData: WebPushNotificationData = {
            userId: options.userId,
            type: options.notification.type,
            title: formattedNotification.title,
            content: formattedNotification.body,
            metadata: options.notification.metadata,
            icon: formattedNotification.icon,
            actions: formattedNotification.actions,
          };

          const webResult = await this.webPushDeliveryService.sendWebPushNotification(
            platformTokens,
            webPushData
          );
          
          results.success += webResult.success;
          results.failed += webResult.failed;
        }
        // TODO: Add Android/iOS push notification delivery when FCM is integrated
      }

      return results;
    } catch (error) {
      this.logger.error(`Push notification delivery failed: ${error.message}`);
      return { success: 0, failed: 0, error: error.message };
    }
  }

  private async queueForOfflineUser(options: DeliveryOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const queuedNotification: Omit<QueuedNotification, 'queuedAt' | 'attempts'> = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: options.userId,
        type: options.notification.type,
        title: options.notification.title,
        content: options.notification.content,
        metadata: options.notification.metadata,
        priority: options.priority,
        maxAttempts: this.getMaxAttempts(options.priority),
      };

      await this.offlineQueueService.queueNotification(queuedNotification);
      return { success: true };
    } catch (error) {
      this.logger.error(`Queue delivery failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private getDefaultChannels(priority: string, type: NotificationType): ('websocket' | 'email' | 'push' | 'queue')[] {
    const criticalTypes = [
      NotificationType.SYSTEM_ERROR,
      NotificationType.SECURITY_ALERT,
      NotificationType.PERFORMANCE_DEGRADATION,
    ];

    const highPriorityTypes = [
      NotificationType.BIAS_ALERT,
      NotificationType.NEW_APPLICATION,
      NotificationType.CANDIDATE_SHORTLISTED,
    ];

    if (priority === 'critical' || criticalTypes.includes(type)) {
      return ['websocket', 'email', 'push', 'queue'];
    }

    if (priority === 'high' || highPriorityTypes.includes(type)) {
      return ['websocket', 'push', 'queue'];
    }

    return ['websocket', 'queue'];
  }

  private shouldSendEmail(priority: string, type: NotificationType, isUserOnline: boolean): boolean {
    const criticalTypes = [
      NotificationType.SYSTEM_ERROR,
      NotificationType.SECURITY_ALERT,
      NotificationType.PERFORMANCE_DEGRADATION,
      NotificationType.HEALTH_METRICS_ALERT,
    ];

    // Always send email for critical alerts
    if (priority === 'critical' || criticalTypes.includes(type)) {
      return true;
    }

    // Send email for high priority if user is offline
    if (priority === 'high' && !isUserOnline) {
      return true;
    }

    return false;
  }

  private getMaxAttempts(priority: string): number {
    switch (priority) {
      case 'critical':
        return 5;
      case 'high':
        return 3;
      case 'medium':
        return 2;
      default:
        return 1;
    }
  }

  private logDeliveryResult(options: DeliveryOptions, result: DeliveryResult): void {
    const summary = {
      userId: options.userId,
      type: options.notification.type,
      priority: options.priority,
      websocket: result.websocket.success,
      email: result.email.success,
      push: `${result.push.success}/${result.push.success + result.push.failed}`,
      queue: result.queue.success,
    };

    this.logger.log(`Multi-channel delivery completed: ${JSON.stringify(summary)}`);
  }

  async getDeliveryStats(): Promise<{
    totalDeliveries: number;
    successRate: number;
    channelStats: Record<string, { success: number; failed: number }>;
  }> {
    // This would typically be stored in Redis or database
    // For now, return placeholder stats
    return {
      totalDeliveries: 0,
      successRate: 0,
      channelStats: {
        websocket: { success: 0, failed: 0 },
        email: { success: 0, failed: 0 },
        push: { success: 0, failed: 0 },
        queue: { success: 0, failed: 0 },
      },
    };
  }
}