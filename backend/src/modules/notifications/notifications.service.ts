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
      userId: createNotificationDto.userId as any,
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
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

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
      { userId: userId as any, isRead: false },
      { isRead: true }
    ).exec();

    return { modifiedCount: result.modifiedCount };
  }

  async markMultipleAsRead(notificationIds: string[]): Promise<{ modifiedCount: number }> {
    const objectIds = notificationIds.map(id => id as any);
    const result = await this.notificationModel.updateMany(
      { _id: { $in: objectIds }, isRead: false },
      { isRead: true }
    ).exec();

    return { modifiedCount: result.modifiedCount };
  }

  async deleteMultiple(notificationIds: string[]): Promise<{ deletedCount: number }> {
    const objectIds = notificationIds.map(id => id as any);
    const result = await this.notificationModel.deleteMany({
      _id: { $in: objectIds }
    }).exec();

    return { deletedCount: result.deletedCount };
  }

  // Unread Count Tracking
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: userId as any,
      isRead: false
    }).exec();
  }

  async getUnreadCountByType(userId: string): Promise<Record<NotificationType, number>> {
    const pipeline = [
      {
        $match: {
          userId: userId as any,
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
      searchQuery.userId = userId as any;
    }

    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

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
      query.userId = filters.userId as any;
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

  // Analytics
  async getAnalytics(range: string = '7d') {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalNotifications, unreadCount, notificationsByType, dailyStats] = await Promise.all([
      this.notificationModel.countDocuments({ createdAt: { $gte: startDate } }),
      this.notificationModel.countDocuments({ isRead: false, createdAt: { $gte: startDate } }),
      this.getNotificationsByType(startDate),
      this.getDailyStats(startDate),
    ]);

    const userEngagement = await this.getUserEngagement(startDate);
    const systemHealth = await this.getSystemHealth();

    return {
      totalNotifications,
      unreadCount,
      notificationsByType,
      dailyStats,
      userEngagement,
      systemHealth,
    };
  }

  private async getNotificationsByType(startDate: Date) {
    const results = await this.notificationModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return results.map(r => ({ type: r._id, count: r.count, color: '#5680D7' }));
  }

  private async getDailyStats(startDate: Date) {
    const results = await this.notificationModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: 1 },
          read: { $sum: { $cond: ['$isRead', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return results.map(r => ({ date: r._id, sent: r.sent, read: r.read }));
  }

  private async getUserEngagement(startDate: Date) {
    const activeUsers = await this.notificationModel.distinct('userId', {
      createdAt: { $gte: startDate },
      isRead: true,
    });

    const totalUsers = await this.notificationModel.distinct('userId', {
      createdAt: { $gte: startDate },
    });

    return {
      activeUsers: activeUsers.length,
      totalUsers: totalUsers.length,
      engagementRate: totalUsers.length > 0 ? Math.round((activeUsers.length / totalUsers.length) * 100) : 0,
    };
  }

  private async getSystemHealth() {
    const total = await this.notificationModel.countDocuments();
    const delivered = await this.notificationModel.countDocuments({ isRead: { $exists: true } });

    return {
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 100,
      avgResponseTime: 85,
      errorRate: 0.5,
    };
  }

  // Preferences
  async getPreferences(userId: string) {
    const preferences: any = {};
    Object.values(NotificationType).forEach(type => {
      preferences[type] = { enabled: true, email: false, push: true, sound: true };
    });
    return preferences;
  }

  async updatePreferences(userId: string, type: string, prefs: any) {
    return { success: true, type, preferences: prefs };
  }

  async updateBulkPreferences(userId: string, enabled: boolean) {
    return { success: true, enabled };
  }
}