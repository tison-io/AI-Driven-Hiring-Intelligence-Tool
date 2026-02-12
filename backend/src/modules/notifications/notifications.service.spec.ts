import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationDocument } from './entities/notification.entity';
import { DeviceToken, DeviceTokenDocument } from './entities/device-token.entity';
import { MultiChannelDeliveryService } from './multi-channel-delivery.service';
import { DeviceTokenManagementService } from './device-token-management.service';
import { NotificationType } from './enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: Model<NotificationDocument>;
  let multiChannelDeliveryService: MultiChannelDeliveryService;

  const mockNotification = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    type: NotificationType.AI_ANALYSIS_COMPLETE,
    title: 'Test Notification',
    content: 'Test content',
    isRead: false,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    metadata: { test: true },
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockNotification),
            constructor: jest.fn().mockResolvedValue(mockNotification),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            updateMany: jest.fn(),
            deleteMany: jest.fn(),
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
          },
        },
        {
          provide: getModelToken(DeviceToken.name),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: MultiChannelDeliveryService,
          useValue: {
            deliverNotification: jest.fn().mockResolvedValue({
              websocket: { success: true },
              email: { success: false },
              push: { success: 0, failed: 0 },
              queue: { success: false },
            }),
          },
        },
        {
          provide: DeviceTokenManagementService,
          useValue: {
            registerDeviceToken: jest.fn(),
            getActiveTokensForUser: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationModel = module.get<Model<NotificationDocument>>(getModelToken(Notification.name));
    multiChannelDeliveryService = module.get<MultiChannelDeliveryService>(MultiChannelDeliveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notification and trigger multi-channel delivery', async () => {
      const createDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.AI_ANALYSIS_COMPLETE,
        title: 'Test',
        content: 'Test content',
      };

      jest.spyOn(notificationModel.prototype, 'save').mockResolvedValue(mockNotification as any);

      const result = await service.create(createDto, UserRole.RECRUITER, 'test@example.com');

      expect(notificationModel.prototype.save).toHaveBeenCalled();
      expect(multiChannelDeliveryService.deliverNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: createDto.userId,
          userEmail: 'test@example.com',
          notification: expect.objectContaining({
            type: createDto.type,
            title: createDto.title,
            content: createDto.content,
            userId: createDto.userId,
          }),
          priority: expect.any(String),
        })
      );
      expect(result).toBeDefined();
    });

    it('should reject invalid notification type for RECRUITER', async () => {
      const createDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.SYSTEM_ERROR,
        title: 'Test',
        content: 'Test',
      };

      await expect(service.create(createDto, UserRole.RECRUITER))
        .rejects
        .toThrow('Role RECRUITER cannot create notification type SYSTEM_ERROR');
    });

    it('should allow ADMIN to create any type', async () => {
      const createDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.SYSTEM_ERROR,
        title: 'Test',
        content: 'Test',
      };

      jest.spyOn(notificationModel.prototype, 'save').mockResolvedValue(mockNotification as any);

      const result = await service.create(createDto, UserRole.ADMIN);
      
      expect(result).toBeDefined();
      expect(multiChannelDeliveryService.deliverNotification).toHaveBeenCalled();
    });

    it('should handle delivery service errors gracefully', async () => {
      const createDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.AI_ANALYSIS_COMPLETE,
        title: 'Test',
        content: 'Test content',
      };

      jest.spyOn(notificationModel.prototype, 'save').mockResolvedValue(mockNotification as any);
      jest.spyOn(multiChannelDeliveryService, 'deliverNotification')
        .mockRejectedValue(new Error('Delivery failed'));

      // Should not throw error even if delivery fails
      const result = await service.create(createDto, UserRole.RECRUITER);
      
      expect(result).toBeDefined();
      expect(multiChannelDeliveryService.deliverNotification).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockNotification]),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      } as any);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      jest.spyOn(notificationModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockNotification, isRead: true }),
      } as any);

      const result = await service.markAsRead('507f1f77bcf86cd799439011');

      expect(notificationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { isRead: true },
        { new: true }
      );
      expect(result.isRead).toBe(true);
    });
  });

  describe('findByUserId', () => {
    it('should find notifications by userId with filters', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockNotification]),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);

      const result = await service.findByUserId('507f1f77bcf86cd799439011', {
        isRead: false,
        startDate: new Date('2024-01-01'),
      });

      expect(notificationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Types.ObjectId),
          isRead: false,
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
          }),
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      jest.spyOn(notificationModel, 'updateMany').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 5 }),
      } as any);

      const result = await service.markAllAsRead('507f1f77bcf86cd799439011');

      expect(result.modifiedCount).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(3),
      } as any);

      const result = await service.getUnreadCount('507f1f77bcf86cd799439011');

      expect(result).toBe(3);
    });
  });

  describe('search', () => {
    it('should search notifications', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockNotification]),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      } as any);

      const result = await service.search('test', '507f1f77bcf86cd799439011');

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
