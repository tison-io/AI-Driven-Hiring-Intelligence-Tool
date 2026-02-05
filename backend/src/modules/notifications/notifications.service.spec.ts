import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationsService, CreateNotificationDto } from '../src/modules/notifications/notifications.service';
import { Notification, NotificationDocument } from '../src/modules/notifications/entities/notification.entity';
import { DeviceToken, DeviceTokenDocument } from '../src/modules/notifications/entities/device-token.entity';
import { NotificationType } from '../src/modules/notifications/enums/notification-type.enum';
import { UserRole } from '../src/common/enums/user-role.enum';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: Model<NotificationDocument>;
  let deviceTokenModel: Model<DeviceTokenDocument>;

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

  const mockDeviceToken = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    token: 'test-token',
    platform: 'web',
    userAgent: 'test-agent',
    lastUsed: new Date(),
    isActive: true,
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
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(DeviceToken.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockDeviceToken),
            constructor: jest.fn().mockResolvedValue(mockDeviceToken),
            find: jest.fn(),
            updateMany: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationModel = module.get<Model<NotificationDocument>>(getModelToken(Notification.name));
    deviceTokenModel = module.get<Model<DeviceTokenDocument>>(getModelToken(DeviceToken.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification for RECRUITER role', async () => {
      const createDto: CreateNotificationDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.AI_ANALYSIS_COMPLETE,
        title: 'Test Notification',
        content: 'Test content',
        metadata: { test: true },
      };

      const mockSave = jest.fn().mockResolvedValue(mockNotification);
      jest.spyOn(notificationModel, 'constructor' as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await service.create(createDto, UserRole.RECRUITER);

      expect(mockSave).toHaveBeenCalled();
    });

    it('should reject invalid notification type for RECRUITER role', async () => {
      const createDto: CreateNotificationDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.SYSTEM_ERROR, // Admin-only type
        title: 'Test Notification',
        content: 'Test content',
      };

      await expect(service.create(createDto, UserRole.RECRUITER))
        .rejects.toThrow('Role RECRUITER cannot create notification type SYSTEM_ERROR');
    });

    it('should allow ADMIN to create any notification type', async () => {
      const createDto: CreateNotificationDto = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.SYSTEM_ERROR,
        title: 'System Error',
        content: 'System error occurred',
      };

      const mockSave = jest.fn().mockResolvedValue(mockNotification);
      jest.spyOn(notificationModel, 'constructor' as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await service.create(createDto, UserRole.ADMIN);

      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      const mockNotifications = [mockNotification];
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNotifications),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      } as any);

      const result = await service.findAll({}, { page: 1, limit: 10 });

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(notificationModel.find).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      const filters = {
        userId: '507f1f77bcf86cd799439011',
        type: NotificationType.AI_ANALYSIS_COMPLETE,
        isRead: false,
      };

      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      } as any);

      await service.findAll(filters);

      expect(notificationModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId(filters.userId),
        type: filters.type,
        isRead: filters.isRead,
      });
    });
  });

  describe('findById', () => {
    it('should find notification by ID', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockNotification);
      jest.spyOn(notificationModel, 'findById').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(notificationModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockExec).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = { ...mockNotification, isRead: true };
      const mockExec = jest.fn().mockResolvedValue(updatedNotification);
      
      jest.spyOn(notificationModel, 'findByIdAndUpdate').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.markAsRead('507f1f77bcf86cd799439011');

      expect(notificationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { isRead: true },
        { new: true }
      );
      expect(mockExec).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      const mockExec = jest.fn().mockResolvedValue({ modifiedCount: 5 });
      jest.spyOn(notificationModel, 'updateMany').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.markAllAsRead('507f1f77bcf86cd799439011');

      expect(result).toEqual({ modifiedCount: 5 });
      expect(notificationModel.updateMany).toHaveBeenCalledWith(
        { userId: new Types.ObjectId('507f1f77bcf86cd799439011'), isRead: false },
        { isRead: true }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      const mockExec = jest.fn().mockResolvedValue(3);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.getUnreadCount('507f1f77bcf86cd799439011');

      expect(result).toBe(3);
      expect(notificationModel.countDocuments).toHaveBeenCalledWith({
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        isRead: false,
      });
    });
  });

  describe('getUnreadCountByType', () => {
    it('should return unread count grouped by type', async () => {
      const mockAggregateResult = [
        { _id: NotificationType.AI_ANALYSIS_COMPLETE, count: 2 },
        { _id: NotificationType.NEW_APPLICATION, count: 1 },
      ];

      const mockExec = jest.fn().mockResolvedValue(mockAggregateResult);
      jest.spyOn(notificationModel, 'aggregate').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.getUnreadCountByType('507f1f77bcf86cd799439011');

      expect(result[NotificationType.AI_ANALYSIS_COMPLETE]).toBe(2);
      expect(result[NotificationType.NEW_APPLICATION]).toBe(1);
      expect(result[NotificationType.STATUS_CHANGE]).toBe(0); // Should default to 0
    });
  });

  describe('search', () => {
    it('should search notifications by title and content', async () => {
      const mockNotifications = [mockNotification];
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNotifications),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      } as any);

      const result = await service.search('test', '507f1f77bcf86cd799439011');

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 1,
      });

      expect(notificationModel.find).toHaveBeenCalledWith({
        $or: [
          { title: { $regex: 'test', $options: 'i' } },
          { content: { $regex: 'test', $options: 'i' } },
        ],
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      });
    });
  });

  describe('saveDeviceToken', () => {
    it('should save device token and deactivate existing ones', async () => {
      const mockUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      const mockSave = jest.fn().mockResolvedValue(mockDeviceToken);

      jest.spyOn(deviceTokenModel, 'updateMany').mockReturnValue({
        exec: mockUpdateMany,
      } as any);

      jest.spyOn(deviceTokenModel, 'constructor' as any).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await service.saveDeviceToken(
        '507f1f77bcf86cd799439011',
        'new-token',
        'web',
        'test-agent'
      );

      expect(deviceTokenModel.updateMany).toHaveBeenCalledWith(
        { userId: new Types.ObjectId('507f1f77bcf86cd799439011'), platform: 'web' },
        { isActive: false }
      );
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('getActiveDeviceTokens', () => {
    it('should return active device tokens for user', async () => {
      const mockTokens = [mockDeviceToken];
      const mockExec = jest.fn().mockResolvedValue(mockTokens);

      jest.spyOn(deviceTokenModel, 'find').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.getActiveDeviceTokens('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockTokens);
      expect(deviceTokenModel.find).toHaveBeenCalledWith({
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        isActive: true,
      });
    });
  });

  describe('deleteMultiple', () => {
    it('should delete multiple notifications', async () => {
      const notificationIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 2 });

      jest.spyOn(notificationModel, 'deleteMany').mockReturnValue({
        exec: mockExec,
      } as any);

      const result = await service.deleteMultiple(notificationIds);

      expect(result).toEqual({ deletedCount: 2 });
      expect(notificationModel.deleteMany).toHaveBeenCalledWith({
        _id: { $in: notificationIds.map(id => new Types.ObjectId(id)) },
      });
    });
  });

  describe('Role-based permissions', () => {
    const recruiterTypes = [
      NotificationType.NEW_APPLICATION,
      NotificationType.AI_ANALYSIS_COMPLETE,
      NotificationType.BIAS_ALERT,
      NotificationType.BULK_PROCESSING_COMPLETE,
    ];

    const adminTypes = [
      NotificationType.SYSTEM_ERROR,
      NotificationType.SECURITY_ALERT,
      NotificationType.MONTHLY_ANALYTICS_REPORT,
    ];

    recruiterTypes.forEach(type => {
      it(`should allow RECRUITER to create ${type}`, async () => {
        const createDto: CreateNotificationDto = {
          userId: '507f1f77bcf86cd799439011',
          type,
          title: 'Test',
          content: 'Test content',
        };

        const mockSave = jest.fn().mockResolvedValue(mockNotification);
        jest.spyOn(notificationModel, 'constructor' as any).mockImplementation(() => ({
          save: mockSave,
        }));

        await expect(service.create(createDto, UserRole.RECRUITER)).resolves.toBeDefined();
      });
    });

    adminTypes.forEach(type => {
      it(`should reject RECRUITER creating ${type}`, async () => {
        const createDto: CreateNotificationDto = {
          userId: '507f1f77bcf86cd799439011',
          type,
          title: 'Test',
          content: 'Test content',
        };

        await expect(service.create(createDto, UserRole.RECRUITER))
          .rejects.toThrow(`Role RECRUITER cannot create notification type ${type}`);
      });

      it(`should allow ADMIN to create ${type}`, async () => {
        const createDto: CreateNotificationDto = {
          userId: '507f1f77bcf86cd799439011',
          type,
          title: 'Test',
          content: 'Test content',
        };

        const mockSave = jest.fn().mockResolvedValue(mockNotification);
        jest.spyOn(notificationModel, 'constructor' as any).mockImplementation(() => ({
          save: mockSave,
        }));

        await expect(service.create(createDto, UserRole.ADMIN)).resolves.toBeDefined();
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty search results', async () => {
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      } as any);

      const result = await service.search('nonexistent');

      expect(result).toEqual({
        notifications: [],
        total: 0,
      });
    });

    it('should handle date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const mockFind = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(notificationModel, 'find').mockReturnValue(mockFind as any);
      jest.spyOn(notificationModel, 'countDocuments').mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      } as any);

      await service.findAll({ startDate, endDate });

      expect(notificationModel.find).toHaveBeenCalledWith({
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });
    });
  });
});