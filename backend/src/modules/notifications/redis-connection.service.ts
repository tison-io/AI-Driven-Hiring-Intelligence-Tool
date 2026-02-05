import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

export interface ConnectionState {
  userId: string;
  socketId: string;
  userRole: string;
  connectedAt: Date;
  lastActivity: Date;
}

@Injectable()
export class RedisConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisConnectionService.name);
  private client: RedisClientType;
  private readonly CONNECTION_PREFIX = 'ws:connection:';
  private readonly USER_CONNECTIONS_PREFIX = 'ws:user:';
  private readonly CONNECTION_TTL = 3600; // 1 hour

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  // Connection state management
  async saveConnectionState(socketId: string, state: ConnectionState): Promise<void> {
    try {
      const key = `${this.CONNECTION_PREFIX}${socketId}`;
      await this.client.setEx(key, this.CONNECTION_TTL, JSON.stringify(state));

      // Also track user connections
      const userKey = `${this.USER_CONNECTIONS_PREFIX}${state.userId}`;
      await this.client.sAdd(userKey, socketId);
      await this.client.expire(userKey, this.CONNECTION_TTL);

      this.logger.debug(`Saved connection state for socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Error saving connection state: ${error.message}`);
    }
  }

  async getConnectionState(socketId: string): Promise<ConnectionState | null> {
    try {
      const key = `${this.CONNECTION_PREFIX}${socketId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Error getting connection state: ${error.message}`);
      return null;
    }
  }

  async removeConnectionState(socketId: string): Promise<void> {
    try {
      // Get connection state first to remove from user connections
      const state = await this.getConnectionState(socketId);
      
      if (state) {
        const userKey = `${this.USER_CONNECTIONS_PREFIX}${state.userId}`;
        await this.client.sRem(userKey, socketId);
      }

      // Remove connection state
      const key = `${this.CONNECTION_PREFIX}${socketId}`;
      await this.client.del(key);

      this.logger.debug(`Removed connection state for socket ${socketId}`);
    } catch (error) {
      this.logger.error(`Error removing connection state: ${error.message}`);
    }
  }

  async updateLastActivity(socketId: string): Promise<void> {
    try {
      const state = await this.getConnectionState(socketId);
      if (state) {
        state.lastActivity = new Date();
        await this.saveConnectionState(socketId, state);
      }
    } catch (error) {
      this.logger.error(`Error updating last activity: ${error.message}`);
    }
  }

  // User connection tracking
  async getUserConnections(userId: string): Promise<string[]> {
    try {
      const userKey = `${this.USER_CONNECTIONS_PREFIX}${userId}`;
      return await this.client.sMembers(userKey);
    } catch (error) {
      this.logger.error(`Error getting user connections: ${error.message}`);
      return [];
    }
  }

  async isUserConnected(userId: string): Promise<boolean> {
    try {
      const connections = await this.getUserConnections(userId);
      return connections.length > 0;
    } catch (error) {
      this.logger.error(`Error checking user connection: ${error.message}`);
      return false;
    }
  }

  // Notification queue for offline users
  async queueNotificationForOfflineUser(userId: string, notification: any): Promise<void> {
    try {
      const queueKey = `notification:queue:${userId}`;
      const notificationData = {
        ...notification,
        queuedAt: new Date().toISOString(),
      };
      
      await this.client.lPush(queueKey, JSON.stringify(notificationData));
      await this.client.expire(queueKey, 7 * 24 * 60 * 60); // 7 days TTL
      
      this.logger.debug(`Queued notification for offline user ${userId}`);
    } catch (error) {
      this.logger.error(`Error queuing notification: ${error.message}`);
    }
  }

  async getQueuedNotifications(userId: string): Promise<any[]> {
    try {
      const queueKey = `notification:queue:${userId}`;
      const notifications = await this.client.lRange(queueKey, 0, -1);
      
      // Clear the queue after retrieving
      await this.client.del(queueKey);
      
      return notifications.map(n => JSON.parse(n));
    } catch (error) {
      this.logger.error(`Error getting queued notifications: ${error.message}`);
      return [];
    }
  }

  // Connection health monitoring
  async getConnectionStats(): Promise<{
    totalConnections: number;
    uniqueUsers: number;
    connectionsByRole: Record<string, number>;
  }> {
    try {
      const connectionKeys = await this.client.keys(`${this.CONNECTION_PREFIX}*`);
      const connections = await Promise.all(
        connectionKeys.map(key => this.client.get(key))
      );

      const validConnections = connections
        .filter(Boolean)
        .map(data => JSON.parse(data));

      const uniqueUsers = new Set(validConnections.map(c => c.userId)).size;
      
      const connectionsByRole = validConnections.reduce((acc, conn) => {
        acc[conn.userRole] = (acc[conn.userRole] || 0) + 1;
        return acc;
      }, {});

      return {
        totalConnections: validConnections.length,
        uniqueUsers,
        connectionsByRole,
      };
    } catch (error) {
      this.logger.error(`Error getting connection stats: ${error.message}`);
      return {
        totalConnections: 0,
        uniqueUsers: 0,
        connectionsByRole: {},
      };
    }
  }

  // Rate limiting support
  async incrementNotificationCount(userId: string): Promise<number> {
    try {
      const key = `notification:rate:${userId}`;
      const count = await this.client.incr(key);
      
      if (count === 1) {
        await this.client.expire(key, 60); // 1 minute window
      }
      
      return count;
    } catch (error) {
      this.logger.error(`Error incrementing notification count: ${error.message}`);
      return 0;
    }
  }

  async getNotificationCount(userId: string): Promise<number> {
    try {
      const key = `notification:rate:${userId}`;
      const count = await this.client.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      this.logger.error(`Error getting notification count: ${error.message}`);
      return 0;
    }
  }
}