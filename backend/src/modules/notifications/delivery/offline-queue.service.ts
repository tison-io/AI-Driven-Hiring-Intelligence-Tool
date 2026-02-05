import { Injectable, Logger } from '@nestjs/common';
import { RedisConnectionService } from '../redis-connection.service';
import { NotificationType } from '../enums/notification-type.enum';

export interface QueuedNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  queuedAt: Date;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
}

@Injectable()
export class OfflineQueueService {
  private readonly logger = new Logger(OfflineQueueService.name);
  private readonly QUEUE_PREFIX = 'notification:offline:';
  private readonly FAILED_QUEUE_PREFIX = 'notification:failed:';
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly QUEUE_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor(private redisConnectionService: RedisConnectionService) {}

  async queueNotification(notification: Omit<QueuedNotification, 'queuedAt' | 'attempts'>): Promise<void> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${notification.userId}`;
      
      const queuedNotification: QueuedNotification = {
        ...notification,
        queuedAt: new Date(),
        attempts: 0,
      };

      // Add to user's queue
      await this.redisConnectionService['client'].lPush(
        queueKey,
        JSON.stringify(queuedNotification)
      );

      // Trim queue to max size
      await this.redisConnectionService['client'].lTrim(queueKey, 0, this.MAX_QUEUE_SIZE - 1);
      
      // Set TTL
      await this.redisConnectionService['client'].expire(queueKey, this.QUEUE_TTL);

      this.logger.debug(`Queued notification ${notification.id} for offline user ${notification.userId}`);
    } catch (error) {
      this.logger.error(`Failed to queue notification: ${error.message}`);
    }
  }

  async getQueuedNotifications(userId: string, limit: number = 50): Promise<QueuedNotification[]> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${userId}`;
      const notifications = await this.redisConnectionService['client'].lRange(queueKey, 0, limit - 1);
      
      return notifications.map(n => JSON.parse(n));
    } catch (error) {
      this.logger.error(`Failed to get queued notifications: ${error.message}`);
      return [];
    }
  }

  async deliverQueuedNotifications(userId: string): Promise<QueuedNotification[]> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${userId}`;
      const notifications = await this.getQueuedNotifications(userId);
      
      if (notifications.length > 0) {
        // Clear the queue after retrieving
        await this.redisConnectionService['client'].del(queueKey);
        this.logger.log(`Delivered ${notifications.length} queued notifications to user ${userId}`);
      }
      
      return notifications;
    } catch (error) {
      this.logger.error(`Failed to deliver queued notifications: ${error.message}`);
      return [];
    }
  }

  async getQueueStats(userId: string): Promise<{
    totalQueued: number;
    byPriority: Record<string, number>;
    oldestNotification?: Date;
  }> {
    try {
      const notifications = await this.getQueuedNotifications(userId);
      
      const byPriority = notifications.reduce((acc, notif) => {
        acc[notif.priority] = (acc[notif.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const oldestNotification = notifications.length > 0 
        ? new Date(Math.min(...notifications.map(n => new Date(n.queuedAt).getTime())))
        : undefined;

      return {
        totalQueued: notifications.length,
        byPriority,
        oldestNotification,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      return { totalQueued: 0, byPriority: {} };
    }
  }

  async moveToFailedQueue(notification: QueuedNotification, error: string): Promise<void> {
    try {
      const failedKey = `${this.FAILED_QUEUE_PREFIX}${notification.userId}`;
      
      const failedNotification = {
        ...notification,
        failedAt: new Date(),
        error,
        attempts: notification.attempts + 1,
      };

      await this.redisConnectionService['client'].lPush(
        failedKey,
        JSON.stringify(failedNotification)
      );

      // Trim failed queue
      await this.redisConnectionService['client'].lTrim(failedKey, 0, 49); // Keep last 50
      
      // Set TTL for failed queue (30 days)
      await this.redisConnectionService['client'].expire(failedKey, 30 * 24 * 60 * 60);

      this.logger.warn(`Moved notification ${notification.id} to failed queue for user ${notification.userId}`);
    } catch (error) {
      this.logger.error(`Failed to move notification to failed queue: ${error.message}`);
    }
  }

  async getFailedNotifications(userId: string): Promise<any[]> {
    try {
      const failedKey = `${this.FAILED_QUEUE_PREFIX}${userId}`;
      const notifications = await this.redisConnectionService['client'].lRange(failedKey, 0, -1);
      
      return notifications.map(n => JSON.parse(n));
    } catch (error) {
      this.logger.error(`Failed to get failed notifications: ${error.message}`);
      return [];
    }
  }

  async clearUserQueue(userId: string): Promise<void> {
    try {
      const queueKey = `${this.QUEUE_PREFIX}${userId}`;
      await this.redisConnectionService['client'].del(queueKey);
      this.logger.log(`Cleared notification queue for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear user queue: ${error.message}`);
    }
  }

  async getGlobalQueueStats(): Promise<{
    totalUsers: number;
    totalNotifications: number;
    averageQueueSize: number;
  }> {
    try {
      const pattern = `${this.QUEUE_PREFIX}*`;
      const keys = await this.redisConnectionService['client'].keys(pattern);
      
      if (keys.length === 0) {
        return { totalUsers: 0, totalNotifications: 0, averageQueueSize: 0 };
      }

      const queueSizes = await Promise.all(
        keys.map(key => this.redisConnectionService['client'].lLen(key))
      );

      const totalNotifications = queueSizes.reduce((sum, size) => sum + size, 0);
      const averageQueueSize = totalNotifications / keys.length;

      return {
        totalUsers: keys.length,
        totalNotifications,
        averageQueueSize: Math.round(averageQueueSize * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to get global queue stats: ${error.message}`);
      return { totalUsers: 0, totalNotifications: 0, averageQueueSize: 0 };
    }
  }
}