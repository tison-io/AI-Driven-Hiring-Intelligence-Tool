import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationEventService } from '../notification-event.service';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Candidate, CandidateDocument } from '../../candidates/entities/candidate.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class MonthlyAnalyticsService {
  private readonly logger = new Logger(MonthlyAnalyticsService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private notificationEventService: NotificationEventService,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyReport() {
    this.logger.log('Starting monthly analytics report generation...');

    try {
      const adminUsers = await this.getAdminUserIds();
      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found for monthly report');
        return;
      }

      const reportData = await this.collectMonthlyData();
      
      this.notificationEventService.emitMonthlyAnalyticsReport({
        adminUsers,
        reportData,
      });

      this.logger.log(`Monthly analytics report sent to ${adminUsers.length} admins`);
    } catch (error) {
      this.logger.error(`Failed to generate monthly report: ${error.message}`);
    }
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userModel.find({ role: UserRole.ADMIN }).select('_id').exec();
    return admins.map(admin => admin._id.toString());
  }

  private async collectMonthlyData() {
    const lastMonth = this.getLastMonthRange();
    
    const [totalProcessed, avgScore, successRate, topCandidates] = await Promise.all([
      this.candidateModel.countDocuments({
        status: 'completed',
        createdAt: { $gte: lastMonth.start, $lte: lastMonth.end },
      }),
      this.getAverageScore(lastMonth),
      this.getSuccessRate(lastMonth),
      this.getTopCandidates(lastMonth),
    ]);

    return {
      period: `${lastMonth.start.toISOString().slice(0, 7)}`,
      totalProcessed,
      averageScore: avgScore,
      successRate,
      topCandidates,
    };
  }

  private getLastMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end };
  }

  private async getAverageScore(range: { start: Date; end: Date }) {
    const candidates = await this.candidateModel
      .find({
        status: 'completed',
        roleFitScore: { $exists: true, $ne: null },
        createdAt: { $gte: range.start, $lte: range.end },
      })
      .select('roleFitScore');

    if (candidates.length === 0) return 0;
    return Math.round(
      candidates.reduce((sum, c) => sum + (c.roleFitScore || 0), 0) / candidates.length
    );
  }

  private async getSuccessRate(range: { start: Date; end: Date }) {
    const [completed, failed] = await Promise.all([
      this.candidateModel.countDocuments({
        status: 'completed',
        createdAt: { $gte: range.start, $lte: range.end },
      }),
      this.candidateModel.countDocuments({
        status: 'failed',
        createdAt: { $gte: range.start, $lte: range.end },
      }),
    ]);

    const total = completed + failed;
    return total > 0 ? Math.round((completed / total) * 100) : 100;
  }

  private async getTopCandidates(range: { start: Date; end: Date }) {
    return this.candidateModel
      .find({
        status: 'completed',
        roleFitScore: { $gte: 80 },
        createdAt: { $gte: range.start, $lte: range.end },
      })
      .sort({ roleFitScore: -1 })
      .limit(5)
      .select('name jobRole roleFitScore')
      .exec();
  }
}
