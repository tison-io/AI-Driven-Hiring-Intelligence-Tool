import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationEventService } from '../notification-event.service';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Candidate, CandidateDocument } from '../../candidates/entities/candidate.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private readonly PROCESSING_TIME_THRESHOLD = 120000; // 2 minutes in ms
  private readonly ERROR_RATE_THRESHOLD = 5; // 5%

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private notificationEventService: NotificationEventService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async monitorPerformance() {
    this.logger.log('Running performance monitoring check...');

    try {
      await Promise.all([
        this.checkProcessingTime(),
        this.checkErrorRate(),
        this.checkSystemHealth(),
      ]);
    } catch (error) {
      this.logger.error(`Performance monitoring failed: ${error.message}`);
    }
  }

  private async checkProcessingTime() {
    const last10Minutes = new Date(Date.now() - 10 * 60 * 1000);
    
    const recentCandidates = await this.candidateModel
      .find({
        status: 'completed',
        processingTime: { $exists: true, $ne: null },
        createdAt: { $gte: last10Minutes },
      })
      .select('processingTime');

    if (recentCandidates.length === 0) return;

    const avgProcessingTime = 
      recentCandidates.reduce((sum, c) => sum + (c.processingTime || 0), 0) / 
      recentCandidates.length;

    if (avgProcessingTime > this.PROCESSING_TIME_THRESHOLD) {
      const adminUsers = await this.getAdminUserIds();
      
      this.notificationEventService.emitPerformanceDegradation({
        type: 'performance',
        severity: 'high',
        message: `Average processing time exceeded threshold: ${Math.round(avgProcessingTime / 1000)}s (threshold: ${this.PROCESSING_TIME_THRESHOLD / 1000}s)`,
        details: {
          avgProcessingTime: Math.round(avgProcessingTime),
          threshold: this.PROCESSING_TIME_THRESHOLD,
          sampleSize: recentCandidates.length,
        },
        affectedUsers: adminUsers,
      });

      this.logger.warn(`Performance degradation detected: ${avgProcessingTime}ms avg processing time`);
    }
  }

  private async checkErrorRate() {
    const last10Minutes = new Date(Date.now() - 10 * 60 * 1000);
    
    const [completed, failed] = await Promise.all([
      this.candidateModel.countDocuments({
        status: 'completed',
        createdAt: { $gte: last10Minutes },
      }),
      this.candidateModel.countDocuments({
        status: 'failed',
        createdAt: { $gte: last10Minutes },
      }),
    ]);

    const total = completed + failed;
    if (total === 0) return;

    const errorRate = (failed / total) * 100;

    if (errorRate > this.ERROR_RATE_THRESHOLD) {
      const adminUsers = await this.getAdminUserIds();
      
      this.notificationEventService.emitPerformanceDegradation({
        type: 'performance',
        severity: 'critical',
        message: `Error rate exceeded threshold: ${errorRate.toFixed(2)}% (threshold: ${this.ERROR_RATE_THRESHOLD}%)`,
        details: {
          errorRate: Math.round(errorRate * 100) / 100,
          threshold: this.ERROR_RATE_THRESHOLD,
          failed,
          total,
        },
        affectedUsers: adminUsers,
      });

      this.logger.warn(`High error rate detected: ${errorRate.toFixed(2)}%`);
    }
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userModel.find({ role: UserRole.ADMIN }).select('_id').exec();
    return admins.map(admin => admin._id.toString());
  }

  private async checkSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = usedMemory / totalMemory;
    const MEMORY_THRESHOLD = 0.85; // 85%

    if (memoryPercentage > MEMORY_THRESHOLD) {
      const adminUsers = await this.getAdminUserIds();
      
      this.notificationEventService.emitHealthMetricsAlert({
        type: 'health',
        severity: memoryPercentage > 0.95 ? 'critical' : 'high',
        message: `High memory usage detected: ${(memoryPercentage * 100).toFixed(2)}%`,
        details: {
          memoryUsage: {
            used: Math.round(usedMemory / 1024 / 1024),
            total: Math.round(totalMemory / 1024 / 1024),
            percentage: (memoryPercentage * 100).toFixed(2),
          },
          threshold: (MEMORY_THRESHOLD * 100).toFixed(0),
          timestamp: new Date().toISOString(),
        },
        affectedUsers: adminUsers,
      });

      this.logger.warn(`High memory usage detected: ${(memoryPercentage * 100).toFixed(2)}%`);
    }
  }
}
