import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './entities/notification.entity';
import { DeviceToken, DeviceTokenDocument } from './entities/device-token.entity';
import { NotificationType } from './enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { MultiChannelDeliveryService, DeliveryOptions } from './multi-channel-delivery.service';
import { DeviceTokenManagementService } from './device-token-management.service';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceTokenDocument>,
    private multiChannelDeliveryService: MultiChannelDeliveryService,
    private deviceTokenManagementService: DeviceTokenManagementService,
  ) {}

  // CRUD Operations
  async create(createNotificationDto: CreateNotificationDto, userRole: UserRole, userEmail?: string): Promise<Notification> {
    // Role-based validation
    if (!this.canCreateNotificationType(createNotificationDto.type, userRole)) {
      throw new Error(`Role ${userRole} cannot create notification type ${createNotificationDto.type}`);
    }

    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId: new Types.ObjectId(createNotificationDto.userId),
    });

    const savedNotification = await notification.save();

    // Trigger multi-channel delivery
    const deliveryOptions: DeliveryOptions = {
      userId: createNotificationDto.userId,
      userEmail,
      notification: {
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        content: createNotificationDto.content,
        metadata: createNotificationDto.metadata,
        userId: createNotificationDto.userId,
      },
      priority: this.getNotificationPriority(createNotificationDto.type),
    };

    try {
      const deliveryResult = await this.multiChannelDeliveryService.deliverNotification(deliveryOptions);
      this.logger.log(`Notification ${savedNotification._id} delivered via multiple channels`);
    } catch (error) {
      this.logger.error(`Failed to deliver notification ${savedNotification._id}: ${error.message}`);
    }

    return savedNotification;
  }

  async findAll(
    filters: NotificationFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ notifications: Notification[]; total: number; page: number; totalPages: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const query = this.buildFilterQuery(filters);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(query).exec(),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Notification> {
    return this.notificationModel.findById(id).exec();
  }

  async findByUserId(userId: string, filters: Omit<NotificationFilters, 'userId'> = {}): Promise<Notification[]> {
    const query = this.buildFilterQuery({ ...filters, userId });
    return this.notificationModel.find(query).sort({ createdAt: -1 }).exec();
  }

  // Read/Unread Status Management
  async markAsRead(id: string): Promise<Notification> {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    ).exec();
  }

  async markAsUnread(id: string): Promise<Notification> {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { isRead: false },
      { new: true }
    ).exec();
  }

  // Bulk Operations
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    ).exec();

    return { modifiedCount: result.modifiedCount };
  }

  async markMultipleAsRead(notificationIds: string[]): Promise<{ modifiedCount: number }> {
    const objectIds = notificationIds.map(id => new Types.ObjectId(id));
    const result = await this.notificationModel.updateMany(
      { _id: { $in: objectIds }, isRead: false },
      { isRead: true }
    ).exec();

    return { modifiedCount: result.modifiedCount };
  }

  async deleteMultiple(notificationIds: string[]): Promise<{ deletedCount: number }> {
    const objectIds = notificationIds.map(id => new Types.ObjectId(id));
    const result = await this.notificationModel.deleteMany({
      _id: { $in: objectIds }
    }).exec();

    return { deletedCount: result.deletedCount };
  }

  // Unread Count Tracking
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false
    }).exec();
  }

  async getUnreadCountByType(userId: string): Promise<Record<NotificationType, number>> {
    const pipeline = [
      {
        $match: {
          userId: new Types.ObjectId(userId),
          isRead: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ];

    const results = await this.notificationModel.aggregate(pipeline).exec();
    
    // Initialize all types with 0
    const counts: Record<NotificationType, number> = {} as Record<NotificationType, number>;
    Object.values(NotificationType).forEach(type => {
      counts[type] = 0;
    });

    // Fill in actual counts
    results.forEach(result => {
      counts[result._id] = result.count;
    });

    return counts;
  }

  // Search Functionality
  async search(
    searchTerm: string,
    userId?: string,
    pagination: PaginationOptions = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const searchQuery: any = {
      $or: [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (userId) {
      searchQuery.userId = new Types.ObjectId(userId);
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(searchQuery)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(searchQuery).exec(),
    ]);

    return { notifications, total };
  }

  // Device Token Management
  async saveDeviceToken(userId: string, token: string, platform: string, userAgent?: string): Promise<DeviceToken> {
    return this.deviceTokenManagementService.registerDeviceToken({
      userId,
      token,
      platform: platform as any,
      userAgent,
    });
  }

  async getActiveDeviceTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenManagementService.getActiveTokensForUser(userId);
  }

  // Helper Methods
  private buildFilterQuery(filters: NotificationFilters): any {
    const query: any = {};

    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.createdAt.$lte = filters.endDate;
      }
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return query;
  }

  private canCreateNotificationType(type: NotificationType, userRole: UserRole): boolean {
    const recruiterTypes = [
      NotificationType.NEW_APPLICATION,
      NotificationType.STATUS_CHANGE,
      NotificationType.AI_ANALYSIS_COMPLETE,
      NotificationType.PROCESSING_FAILED,
      NotificationType.CANDIDATE_SHORTLISTED,
      NotificationType.BIAS_ALERT,
      NotificationType.DUPLICATE_CANDIDATE,
      NotificationType.BULK_PROCESSING_COMPLETE,
    ];

    const adminTypes = [
      NotificationType.SYSTEM_ERROR,
      NotificationType.SECURITY_ALERT,
      NotificationType.HEALTH_METRICS_ALERT,
      NotificationType.PERFORMANCE_DEGRADATION,
      NotificationType.USER_MILESTONE_REACHED,
      NotificationType.PROCESSING_MILESTONE,
      NotificationType.MONTHLY_ANALYTICS_REPORT,
    ];

    if (userRole === UserRole.ADMIN) {
      return true; // Admin can create all types
    }

    if (userRole === UserRole.RECRUITER) {
      return recruiterTypes.includes(type);
    }

    return false;
  }

  private getNotificationPriority(type: NotificationType): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTypes = [
      NotificationType.SYSTEM_ERROR,
      NotificationType.SECURITY_ALERT,
    ];

    const highTypes = [
      NotificationType.PERFORMANCE_DEGRADATION,
      NotificationType.BIAS_ALERT,
      NotificationType.NEW_APPLICATION,
      NotificationType.CANDIDATE_SHORTLISTED,
    ];

    const mediumTypes = [
      NotificationType.AI_ANALYSIS_COMPLETE,
      NotificationType.STATUS_CHANGE,
      NotificationType.BULK_PROCESSING_COMPLETE,
      NotificationType.HEALTH_METRICS_ALERT,
    ];

    if (criticalTypes.includes(type)) return 'critical';
    if (highTypes.includes(type)) return 'high';
    if (mediumTypes.includes(type)) return 'medium';
    return 'low';
  }
}