import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';
import { NotificationsService } from './notifications.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationType } from './enums/notification-type.enum';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let jwtService: JwtService;
  let notificationsService: NotificationsService;

  const mockSocket = {
    id: 'socket-123',
    handshake: { 
      auth: { token: 'valid-token' },
      headers: {}
    },
    join: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    userId: undefined as string | undefined,
    userRole: undefined as UserRole | undefined,
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: JwtService,
          useValue: { 
            verifyAsync: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: { 
            findByUserId: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    jwtService = module.get<JwtService>(JwtService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    gateway.server = mockServer as any;
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate valid JWT token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-123',
        role: UserRole.RECRUITER,
      });
      jest.spyOn(notificationsService, 'findByUserId').mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.objectContaining({
        message: 'Successfully connected to notification service',
        userId: 'user-123',
        role: UserRole.RECRUITER,
      }));
    });

    it('should reject connection without token', async () => {
      const socketWithoutToken = { ...mockSocket, handshake: { auth: {}, headers: {} } };

      await gateway.handleConnection(socketWithoutToken as any);

      expect(socketWithoutToken.disconnect).toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should reject invalid role', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-123',
        role: 'INVALID_ROLE',
      });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should send missed notifications on reconnect', async () => {
      const missedNotifications = [
        { id: 'notif-1', title: 'Missed 1', isRead: false },
        { id: 'notif-2', title: 'Missed 2', isRead: false },
      ];

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-123',
        role: UserRole.RECRUITER,
      });
      jest.spyOn(notificationsService, 'findByUserId').mockResolvedValue(missedNotifications as any);

      await gateway.handleConnection(mockSocket as any);

      expect(notificationsService.findByUserId).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          isRead: false,
          startDate: expect.any(Date),
        })
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('missed-notifications', {
        count: 2,
        notifications: missedNotifications.slice(0, 10),
      });
    });

    it('should not send missed notifications when none exist', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-123',
        role: UserRole.RECRUITER,
      });
      jest.spyOn(notificationsService, 'findByUserId').mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.emit).not.toHaveBeenCalledWith('missed-notifications', expect.anything());
    });
  });

  describe('handleDisconnect', () => {
    it('should handle user disconnection', () => {
      const authenticatedSocket = { ...mockSocket, userId: 'user-123' };
      
      gateway.handleDisconnect(authenticatedSocket as any);

      expect(gateway.isUserConnected('user-123')).toBe(false);
    });
  });

  describe('handleJoinRoom', () => {
    it('should allow user to join their own room', async () => {
      const authenticatedSocket = { 
        ...mockSocket, 
        userId: 'user-123', 
        userRole: UserRole.RECRUITER 
      };

      await gateway.handleJoinRoom(authenticatedSocket as any, { room: 'user:user-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joined-room', { room: 'user:user-123' });
    });

    it('should allow admin to join admin room', async () => {
      const adminSocket = { 
        ...mockSocket, 
        userId: 'admin-123', 
        userRole: UserRole.ADMIN 
      };

      await gateway.handleJoinRoom(adminSocket as any, { room: 'admin' });

      expect(mockSocket.join).toHaveBeenCalledWith('admin');
    });

    it('should reject unauthorized room access', async () => {
      const authenticatedSocket = { 
        ...mockSocket, 
        userId: 'user-123', 
        userRole: UserRole.RECRUITER 
      };

      await gateway.handleJoinRoom(authenticatedSocket as any, { room: 'admin' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', { 
        message: 'Unauthorized to join this room' 
      });
    });
  });

  describe('handlePing', () => {
    it('should respond to ping with pong', () => {
      gateway.handlePing(mockSocket as any);

      expect(mockSocket.emit).toHaveBeenCalledWith('pong', { 
        timestamp: expect.any(String) 
      });
    });
  });

  describe('broadcastToUser', () => {
    it('should broadcast notification to user room', async () => {
      const notification = {
        id: 'notif-123',
        userId: 'user-123',
        type: NotificationType.AI_ANALYSIS_COMPLETE,
        title: 'Test',
        content: 'Test content',
        createdAt: new Date(),
      };

      await gateway.broadcastToUser('user-123', notification as any);

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', notification);
    });
  });

  describe('broadcastToRole', () => {
    it('should broadcast to role room', async () => {
      const notification = {
        id: 'notif-123',
        userId: 'system',
        type: NotificationType.SYSTEM_ERROR,
        title: 'System Error',
        content: 'Error occurred',
        createdAt: new Date(),
      };

      await gateway.broadcastToRole(UserRole.ADMIN, notification as any);

      expect(mockServer.to).toHaveBeenCalledWith('admin');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', notification);
    });
  });

  describe('broadcastToAll', () => {
    it('should broadcast to all connected users', async () => {
      const notification = {
        id: 'notif-123',
        userId: 'system',
        type: NotificationType.SYSTEM_ERROR,
        title: 'System Maintenance',
        content: 'Scheduled maintenance',
        createdAt: new Date(),
      };

      await gateway.broadcastToAll(notification as any);

      expect(mockServer.emit).toHaveBeenCalledWith('notification', notification);
    });
  });

  describe('Connection tracking', () => {
    it('should track user connections', () => {
      gateway['addUserConnection']('user-123', 'socket-123');
      
      expect(gateway.isUserConnected('user-123')).toBe(true);
      expect(gateway.getConnectedUsersCount()).toBe(1);
    });

    it('should remove user connections', () => {
      gateway['addUserConnection']('user-123', 'socket-123');
      gateway['removeUserConnection']('user-123', 'socket-123');
      
      expect(gateway.isUserConnected('user-123')).toBe(false);
      expect(gateway.getConnectedUsersCount()).toBe(0);
    });

    it('should handle multiple connections for same user', () => {
      gateway['addUserConnection']('user-123', 'socket-1');
      gateway['addUserConnection']('user-123', 'socket-2');
      
      expect(gateway.isUserConnected('user-123')).toBe(true);
      
      gateway['removeUserConnection']('user-123', 'socket-1');
      expect(gateway.isUserConnected('user-123')).toBe(true);
      
      gateway['removeUserConnection']('user-123', 'socket-2');
      expect(gateway.isUserConnected('user-123')).toBe(false);
    });

    it('should properly track connections during handleConnection', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user-123',
        role: UserRole.RECRUITER,
      });
      jest.spyOn(notificationsService, 'findByUserId').mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      expect(gateway.isUserConnected('user-123')).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
    });
  });
});
