import { Injectable, Logger } from '@nestjs/common';
import { RedisConnectionService, ConnectionState } from './redis-connection.service';
import { UserRole } from '../../common/enums/user-role.enum';

export interface UserRoom {
  userId: string;
  roomId: string;
  userRole: UserRole;
  joinedAt: Date;
  lastActivity: Date;
}

export interface RoomStats {
  roomId: string;
  userCount: number;
  users: string[];
  createdAt: Date;
}

@Injectable()
export class ConnectionStateService {
  private readonly logger = new Logger(ConnectionStateService.name);
  private readonly ROOM_PREFIX = 'room:';
  private readonly USER_ROOM_PREFIX = 'user-room:';

  constructor(
    private readonly redisConnectionService: RedisConnectionService,
  ) {}

  // User-specific room management
  async createUserRoom(userId: string, userRole: UserRole): Promise<string> {
    const roomId = `user:${userId}`;
    const userRoom: UserRoom = {
      userId,
      roomId,
      userRole,
      joinedAt: new Date(),
      lastActivity: new Date(),
    };

    try {
      // Store room information in Redis
      const roomKey = `${this.ROOM_PREFIX}${roomId}`;
      await this.redisConnectionService['client'].setEx(
        roomKey, 
        3600, // 1 hour TTL
        JSON.stringify(userRoom)
      );

      // Track user's room
      const userRoomKey = `${this.USER_ROOM_PREFIX}${userId}`;
      await this.redisConnectionService['client'].setEx(
        userRoomKey,
        3600,
        roomId
      );

      this.logger.debug(`Created user room ${roomId} for user ${userId}`);
      return roomId;
    } catch (error) {
      this.logger.error(`Error creating user room: ${error.message}`);
      throw error;
    }
  }

  async getUserRoom(userId: string): Promise<string | null> {
    try {
      const userRoomKey = `${this.USER_ROOM_PREFIX}${userId}`;
      return await this.redisConnectionService['client'].get(userRoomKey);
    } catch (error) {
      this.logger.error(`Error getting user room: ${error.message}`);
      return null;
    }
  }

  async updateRoomActivity(roomId: string): Promise<void> {
    try {
      const roomKey = `${this.ROOM_PREFIX}${roomId}`;
      const roomData = await this.redisConnectionService['client'].get(roomKey);
      
      if (roomData) {
        const room: UserRoom = JSON.parse(roomData);
        room.lastActivity = new Date();
        
        await this.redisConnectionService['client'].setEx(
          roomKey,
          3600,
          JSON.stringify(room)
        );
      }
    } catch (error) {
      this.logger.error(`Error updating room activity: ${error.message}`);
    }
  }

  async removeUserRoom(userId: string): Promise<void> {
    try {
      const roomId = await this.getUserRoom(userId);
      if (roomId) {
        const roomKey = `${this.ROOM_PREFIX}${roomId}`;
        const userRoomKey = `${this.USER_ROOM_PREFIX}${userId}`;
        
        await Promise.all([
          this.redisConnectionService['client'].del(roomKey),
          this.redisConnectionService['client'].del(userRoomKey),
        ]);
        
        this.logger.debug(`Removed user room ${roomId} for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error removing user room: ${error.message}`);
    }
  }

  // Role-based room management
  async getRoleRoomUsers(role: UserRole): Promise<string[]> {
    try {
      const pattern = `${this.ROOM_PREFIX}user:*`;
      const keys = await this.redisConnectionService['client'].keys(pattern);
      const users: string[] = [];

      for (const key of keys) {
        const roomData = await this.redisConnectionService['client'].get(key);
        if (roomData) {
          const room: UserRoom = JSON.parse(roomData);
          if (room.userRole === role) {
            users.push(room.userId);
          }
        }
      }

      return users;
    } catch (error) {
      this.logger.error(`Error getting role room users: ${error.message}`);
      return [];
    }
  }

  // Connection state tracking
  async trackConnection(socketId: string, userId: string, userRole: UserRole): Promise<void> {
    const connectionState: ConnectionState = {
      userId,
      socketId,
      userRole,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    try {
      await this.redisConnectionService.saveConnectionState(socketId, connectionState);
      
      // Create or update user room
      await this.createUserRoom(userId, userRole);
      
      this.logger.debug(`Tracking connection ${socketId} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error tracking connection: ${error.message}`);
    }
  }

  async untrackConnection(socketId: string): Promise<void> {
    try {
      const connectionState = await this.redisConnectionService.getConnectionState(socketId);
      
      if (connectionState) {
        // Check if user has other active connections
        const userConnections = await this.redisConnectionService.getUserConnections(connectionState.userId);
        
        // If this is the last connection, remove user room
        if (userConnections.length <= 1) {
          await this.removeUserRoom(connectionState.userId);
        }
      }

      await this.redisConnectionService.removeConnectionState(socketId);
      this.logger.debug(`Untracked connection ${socketId}`);
    } catch (error) {
      this.logger.error(`Error untracking connection: ${error.message}`);
    }
  }

  async updateConnectionActivity(socketId: string): Promise<void> {
    try {
      await this.redisConnectionService.updateLastActivity(socketId);
      
      const connectionState = await this.redisConnectionService.getConnectionState(socketId);
      if (connectionState) {
        const roomId = await this.getUserRoom(connectionState.userId);
        if (roomId) {
          await this.updateRoomActivity(roomId);
        }
      }
    } catch (error) {
      this.logger.error(`Error updating connection activity: ${error.message}`);
    }
  }

  // Room statistics
  async getRoomStats(): Promise<RoomStats[]> {
    try {
      const pattern = `${this.ROOM_PREFIX}*`;
      const keys = await this.redisConnectionService['client'].keys(pattern);
      const stats: RoomStats[] = [];

      for (const key of keys) {
        const roomData = await this.redisConnectionService['client'].get(key);
        if (roomData) {
          const room: UserRoom = JSON.parse(roomData);
          stats.push({
            roomId: room.roomId,
            userCount: 1, // Each user room has 1 user
            users: [room.userId],
            createdAt: room.joinedAt,
          });
        }
      }

      return stats;
    } catch (error) {
      this.logger.error(`Error getting room stats: ${error.message}`);
      return [];
    }
  }

  // Health monitoring
  async getConnectionHealth(): Promise<{
    totalRooms: number;
    activeConnections: number;
    roomsByRole: Record<UserRole, number>;
    averageRoomAge: number;
  }> {
    try {
      const roomStats = await this.getRoomStats();
      const connectionStats = await this.redisConnectionService.getConnectionStats();
      
      const roomsByRole: Record<UserRole, number> = {
        [UserRole.ADMIN]: 0,
        [UserRole.RECRUITER]: 0,
      };

      let totalAge = 0;
      const now = new Date();

      for (const stat of roomStats) {
        // Get room details to determine role
        const roomKey = `${this.ROOM_PREFIX}${stat.roomId}`;
        const roomData = await this.redisConnectionService['client'].get(roomKey);
        if (roomData) {
          const room: UserRoom = JSON.parse(roomData);
          roomsByRole[room.userRole]++;
          totalAge += now.getTime() - room.joinedAt.getTime();
        }
      }

      return {
        totalRooms: roomStats.length,
        activeConnections: connectionStats.totalConnections,
        roomsByRole,
        averageRoomAge: roomStats.length > 0 ? totalAge / roomStats.length : 0,
      };
    } catch (error) {
      this.logger.error(`Error getting connection health: ${error.message}`);
      return {
        totalRooms: 0,
        activeConnections: 0,
        roomsByRole: { [UserRole.ADMIN]: 0, [UserRole.RECRUITER]: 0 },
        averageRoomAge: 0,
      };
    }
  }
}