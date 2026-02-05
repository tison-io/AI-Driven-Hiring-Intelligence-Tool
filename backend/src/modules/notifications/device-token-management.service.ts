import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DeviceToken, DeviceTokenDocument, DevicePlatform } from './entities/device-token.entity';

export interface RegisterDeviceTokenDto {
  userId: string;
  token: string;
  platform: DevicePlatform;
  userAgent?: string;
}

@Injectable()
export class DeviceTokenManagementService {
  private readonly logger = new Logger(DeviceTokenManagementService.name);

  constructor(
    @InjectModel(DeviceToken.name)
    private deviceTokenModel: Model<DeviceTokenDocument>,
  ) {}

  async registerDeviceToken(dto: RegisterDeviceTokenDto): Promise<DeviceToken> {
    try {
      // Check if token already exists
      const existingToken = await this.deviceTokenModel.findOne({
        token: dto.token,
        platform: dto.platform,
      });

      if (existingToken) {
        // Update existing token
        existingToken.userId = new Types.ObjectId(dto.userId);
        existingToken.isActive = true;
        existingToken.lastUsed = new Date();
        existingToken.userAgent = dto.userAgent;
        await existingToken.save();
        
        this.logger.log(`Updated existing device token for user ${dto.userId}`);
        return existingToken;
      }

      // Create new token
      const deviceToken = new this.deviceTokenModel({
        userId: new Types.ObjectId(dto.userId),
        token: dto.token,
        platform: dto.platform,
        userAgent: dto.userAgent,
        lastUsed: new Date(),
      });

      await deviceToken.save();
      this.logger.log(`Registered new device token for user ${dto.userId}`);
      return deviceToken;
    } catch (error) {
      this.logger.error(`Failed to register device token: ${error.message}`);
      throw error;
    }
  }

  async getActiveTokensForUser(userId: string, platform?: DevicePlatform): Promise<DeviceToken[]> {
    try {
      const query: any = {
        userId: new Types.ObjectId(userId),
        isActive: true,
        expiresAt: { $gt: new Date() },
      };

      if (platform) {
        query.platform = platform;
      }

      return await this.deviceTokenModel.find(query).sort({ lastUsed: -1 });
    } catch (error) {
      this.logger.error(`Failed to get active tokens: ${error.message}`);
      return [];
    }
  }

  async deactivateToken(tokenId: string): Promise<boolean> {
    try {
      const result = await this.deviceTokenModel.updateOne(
        { _id: new Types.ObjectId(tokenId) },
        { isActive: false }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to deactivate token: ${error.message}`);
      return false;
    }
  }

  async removeExpiredTokens(): Promise<number> {
    try {
      const result = await this.deviceTokenModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      this.logger.log(`Removed ${result.deletedCount} expired tokens`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to remove expired tokens: ${error.message}`);
      return 0;
    }
  }

  async updateTokenLastUsed(token: string): Promise<void> {
    try {
      await this.deviceTokenModel.updateOne(
        { token },
        { lastUsed: new Date() }
      );
    } catch (error) {
      this.logger.error(`Failed to update token last used: ${error.message}`);
    }
  }

  async getTokenStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    byPlatform: Record<DevicePlatform, number>;
  }> {
    try {
      const [totalTokens, activeTokens, platformStats] = await Promise.all([
        this.deviceTokenModel.countDocuments(),
        this.deviceTokenModel.countDocuments({ isActive: true }),
        this.deviceTokenModel.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$platform', count: { $sum: 1 } } },
        ]),
      ]);

      const byPlatform = platformStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<DevicePlatform, number>);

      return { totalTokens, activeTokens, byPlatform };
    } catch (error) {
      this.logger.error(`Failed to get token stats: ${error.message}`);
      return { totalTokens: 0, activeTokens: 0, byPlatform: {} as Record<DevicePlatform, number> };
    }
  }

  async cleanupInactiveTokens(daysInactive: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

      const result = await this.deviceTokenModel.deleteMany({
        lastUsed: { $lt: cutoffDate },
        isActive: false,
      });

      this.logger.log(`Cleaned up ${result.deletedCount} inactive tokens`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup inactive tokens: ${error.message}`);
      return 0;
    }
  }
}