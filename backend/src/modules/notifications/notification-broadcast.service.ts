import { Injectable, Logger } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { NotificationsService } from './notifications.service';
import { RedisConnectionService } from './redis-connection.service';
import { NotificationType } from './enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export interface BroadcastNotificationDto {
  userId?: string;
  userRole?: UserRole;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class NotificationBroadcastService {
  private readonly logger = new Logger(NotificationBroadcastService.name);

  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationsService: NotificationsService,
    private readonly redisConnectionService: RedisConnectionService,
  ) {}

  // Broadcast to specific user
  async broadcastToUser(userId: string, notification: BroadcastNotificationDto): Promise<void> {
    try {
      // Check rate limiting
      const notificationCount = await this.redisConnectionService.getNotificationCount(userId);
      if (notificationCount >= 100) {
        this.logger.warn(`Rate limit exceeded for user ${userId}`);
        return;
      }

      // Save to database
      const savedNotification = await this.notificationsService.create({
        userId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        metadata: notification.metadata,
      }, UserRole.ADMIN); // Use ADMIN role for system notifications

      // Increment rate limit counter
      await this.redisConnectionService.incrementNotificationCount(userId);

      // Check if user is connected
      const isConnected = await this.redisConnectionService.isUserConnected(userId);
      
      if (isConnected) {
        // Broadcast via WebSocket
        await this.notificationGateway.broadcastToUser(userId, {
          id: (savedNotification as any)._id.toString(),
          userId,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          metadata: notification.metadata,
          createdAt: savedNotification.createdAt,
        });
        this.logger.log(`Broadcasted notification to connected user ${userId}`);
      } else {
        // Queue for offline user
        await this.redisConnectionService.queueNotificationForOfflineUser(userId, {
          id: (savedNotification as any)._id.toString(),
          type: notification.type,
          title: notification.title,
          content: notification.content,
          metadata: notification.metadata,
          createdAt: savedNotification.createdAt,
        });
        this.logger.log(`Queued notification for offline user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error broadcasting to user ${userId}: ${error.message}`);
    }
  }

  // Broadcast to all users with specific role
  async broadcastToRole(role: UserRole, notification: BroadcastNotificationDto): Promise<void> {
    try {
      // Get connection stats to see who's online
      const stats = await this.redisConnectionService.getConnectionStats();
      const roleConnections = stats.connectionsByRole[role] || 0;

      if (roleConnections > 0) {
        // Broadcast via WebSocket to connected users
        await this.notificationGateway.broadcastToRole(role, {
          id: `role-${Date.now()}`,
          userId: 'system',
          type: notification.type,
          title: notification.title,
          content: notification.content,
          metadata: notification.metadata,
          createdAt: new Date(),
        });
        this.logger.log(`Broadcasted notification to ${roleConnections} connected ${role} users`);
      }

      // Note: For role-based notifications, we don't save to individual user databases
      // unless specifically required for audit purposes
    } catch (error) {
      this.logger.error(`Error broadcasting to role ${role}: ${error.message}`);
    }
  }

  // Broadcast system-wide notifications
  async broadcastSystemNotification(notification: BroadcastNotificationDto): Promise<void> {
    try {
      const stats = await this.redisConnectionService.getConnectionStats();
      
      if (stats.totalConnections > 0) {
        await this.notificationGateway.broadcastToAll({
          id: `system-${Date.now()}`,
          userId: 'system',
          type: notification.type,
          title: notification.title,
          content: notification.content,
          metadata: notification.metadata,
          createdAt: new Date(),
        });
        this.logger.log(`Broadcasted system notification to ${stats.totalConnections} connected users`);
      }
    } catch (error) {
      this.logger.error(`Error broadcasting system notification: ${error.message}`);
    }
  }

  // Priority-based broadcasting with different delivery strategies
  async broadcastWithPriority(notification: BroadcastNotificationDto): Promise<void> {
    const priority = notification.priority || 'medium';

    switch (priority) {
      case 'critical':
        // Critical notifications go to all channels immediately
        if (notification.userId) {
          await this.broadcastToUser(notification.userId, notification);
        } else if (notification.userRole) {
          await this.broadcastToRole(notification.userRole, notification);
        } else {
          await this.broadcastSystemNotification(notification);
        }
        break;

      case 'high':
        // High priority notifications with immediate delivery
        if (notification.userId) {
          await this.broadcastToUser(notification.userId, notification);
        } else if (notification.userRole) {
          await this.broadcastToRole(notification.userRole, notification);
        }
        break;

      case 'medium':
      case 'low':
      default:
        // Standard delivery
        if (notification.userId) {
          await this.broadcastToUser(notification.userId, notification);
        } else if (notification.userRole) {
          await this.broadcastToRole(notification.userRole, notification);
        }
        break;
    }
  }

  // Get broadcasting statistics
  async getBroadcastStats(): Promise<{
    connectedUsers: number;
    totalConnections: number;
    connectionsByRole: Record<string, number>;
  }> {
    const stats = await this.redisConnectionService.getConnectionStats();
    return {
      connectedUsers: stats.uniqueUsers,
      totalConnections: stats.totalConnections,
      connectionsByRole: stats.connectionsByRole,
    };
  }
}