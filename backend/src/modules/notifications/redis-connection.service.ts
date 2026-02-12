import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { UserRole } from '../../common/enums/user-role.enum';

export interface ConnectionState {
  userId: string;
  socketId: string;
  userRole: UserRole;
  connectedAt: Date;
  lastActivity: Date;
}

export interface ConnectionStats {
  totalConnections: number;
  connectionsByRole: Record<UserRole, number>;
  averageConnectionTime: number;
  uniqueUsers: number;
}

@Injectable()
export class RedisConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisConnectionService.name);
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    this.client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
        tls: redisHost.includes('upstash.io'),
      },
      password: redisPassword,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis Client Error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis client disconnected');
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async saveConnectionState(socketId: string, connectionState: ConnectionState): Promise<void> {
    const key = `connection:${socketId}`;
    await this.client.setEx(key, 3600, JSON.stringify(connectionState));
  }

  async getConnectionState(socketId: string): Promise<ConnectionState | null> {
    const key = `connection:${socketId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async removeConnectionState(socketId: string): Promise<void> {
    const key = `connection:${socketId}`;
    await this.client.del(key);
  }

  async updateLastActivity(socketId: string): Promise<void> {
    const connectionState = await this.getConnectionState(socketId);
    if (connectionState) {
      connectionState.lastActivity = new Date();
      await this.saveConnectionState(socketId, connectionState);
    }
  }

  async getUserConnections(userId: string): Promise<ConnectionState[]> {
    const pattern = 'connection:*';
    const keys = await this.client.keys(pattern);
    const connections: ConnectionState[] = [];
    
    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        const connection = JSON.parse(data);
        if (connection.userId === userId) {
          connections.push(connection);
        }
      }
    }
    
    return connections;
  }

  async getConnectionStats(): Promise<ConnectionStats> {
    const pattern = 'connection:*';
    const keys = await this.client.keys(pattern);
    const connectionsByRole: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.RECRUITER]: 0,
    };
    
    let totalConnectionTime = 0;
    const now = new Date();
    const uniqueUserIds = new Set<string>();
    
    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        const connection = JSON.parse(data);
        connectionsByRole[connection.userRole]++;
        totalConnectionTime += now.getTime() - new Date(connection.connectedAt).getTime();
        uniqueUserIds.add(connection.userId);
      }
    }
    
    return {
      totalConnections: keys.length,
      connectionsByRole,
      averageConnectionTime: keys.length > 0 ? totalConnectionTime / keys.length : 0,
      uniqueUsers: uniqueUserIds.size,
    };
  }

  async getNotificationCount(userId: string): Promise<number> {
    const key = `notification_count:${userId}`;
    const count = await this.client.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  async incrementNotificationCount(userId: string): Promise<void> {
    const key = `notification_count:${userId}`;
    await this.client.incr(key);
    await this.client.expire(key, 3600); // 1 hour TTL
  }

  async isUserConnected(userId: string): Promise<boolean> {
    const connections = await this.getUserConnections(userId);
    return connections.length > 0;
  }

  async queueNotificationForOfflineUser(userId: string, notification: any): Promise<void> {
    const key = `offline_notifications:${userId}`;
    await this.client.lPush(key, JSON.stringify(notification));
    await this.client.expire(key, 86400); // 24 hours TTL
  }
}
