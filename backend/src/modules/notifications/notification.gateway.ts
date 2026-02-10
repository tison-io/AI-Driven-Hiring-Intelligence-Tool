import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationsService } from './notifications.service';
import { ConnectionStateService } from './connection-state.service';
import { NotificationType } from './enums/notification-type.enum';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
@UseGuards(ThrottlerGuard)
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private socketUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private connectionStateService: ConnectionStateService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.validateToken(token);
      if (!payload) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Role-based access control
      if (!this.hasValidRole(payload.role)) {
        this.logger.warn(`Connection rejected: Invalid role ${payload.role}`);
        client.disconnect();
        return;
      }

      client.userId = payload.sub;
      client.userRole = payload.role;

      // Track connection
      this.addUserConnection(payload.sub, client.id);
      
      // Join user-specific room
      await client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);

      // Send missed notifications on reconnect
      await this.sendMissedNotifications(client);

      // Emit connection success
      client.emit('connected', {
        message: 'Successfully connected to notification service',
        userId: payload.sub,
        role: payload.role,
      });

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.removeUserConnection(client.userId, client.id);
      this.logger.log(`User ${client.userId} disconnected from socket ${client.id}`);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string }
  ) {
    if (!client.userId) return;

    // Only allow joining user-specific rooms or role-based rooms
    const allowedRooms = [
      `user:${client.userId}`,
      client.userRole === UserRole.ADMIN ? 'admin' : null,
      client.userRole === UserRole.RECRUITER ? 'recruiter' : null,
    ].filter(Boolean);

    if (allowedRooms.includes(data.room)) {
      await client.join(data.room);
      client.emit('joined-room', { room: data.room });
      this.logger.log(`User ${client.userId} joined room: ${data.room}`);
    } else {
      client.emit('error', { message: 'Unauthorized to join this room' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string }
  ) {
    await client.leave(data.room);
    client.emit('left-room', { room: data.room });
    this.logger.log(`User ${client.userId} left room: ${data.room}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Public methods for broadcasting notifications
  async broadcastToUser(userId: string, notification: NotificationPayload) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Broadcasted notification ${notification.id} to user ${userId}`);
  }

  async broadcastToRole(role: UserRole, notification: NotificationPayload) {
    const room = role.toLowerCase();
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Broadcasted notification ${notification.id} to role ${role}`);
  }

  async broadcastToAll(notification: NotificationPayload) {
    this.server.emit('notification', notification);
    this.logger.log(`Broadcasted notification ${notification.id} to all users`);
  }

  // Connection management
  private addUserConnection(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
    this.socketUsers.delete(socketId);
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId).size > 0;
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Authentication helpers
  private extractTokenFromSocket(client: Socket): string | null {
    const token = client.handshake.auth?.token || 
                 client.handshake.headers?.authorization?.replace('Bearer ', '');
    return token || null;
  }

  private async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      return null;
    }
  }

  private hasValidRole(role: string): boolean {
    return role === UserRole.ADMIN || role === UserRole.RECRUITER;
  }

  // Missed notifications recovery
  private async sendMissedNotifications(client: AuthenticatedSocket) {
    try {
      // Get notifications from last 24 hours that are unread
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const missedNotifications = await this.notificationsService.findByUserId(
        client.userId,
        {
          isRead: false,
          startDate: oneDayAgo,
        }
      );

      if (missedNotifications.length > 0) {
        client.emit('missed-notifications', {
          count: missedNotifications.length,
          notifications: missedNotifications.slice(0, 10), // Send only latest 10
        });
        this.logger.log(`Sent ${missedNotifications.length} missed notifications to user ${client.userId}`);
      }
    } catch (error) {
      this.logger.error(`Error sending missed notifications: ${error.message}`);
    }
  }
}