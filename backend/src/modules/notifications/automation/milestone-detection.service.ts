import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationEventService } from '../notification-event.service';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Candidate, CandidateDocument } from '../../candidates/entities/candidate.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class MilestoneDetectionService {
  private readonly logger = new Logger(MilestoneDetectionService.name);
  private readonly USER_MILESTONES = [100, 200, 300, 500, 1000, 2000, 5000];
  private readonly PROCESSING_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];
  private lastUserCount = 0;
  private lastProcessingCount = 0;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private notificationEventService: NotificationEventService,
  ) {}

  async checkUserMilestone() {
    try {
      const currentCount = await this.userModel.countDocuments();
      
      const reachedMilestone = this.USER_MILESTONES.find(
        milestone => currentCount >= milestone && this.lastUserCount < milestone
      );

      if (reachedMilestone) {
        const adminUsers = await this.getAdminUserIds();
        
        this.notificationEventService.emitUserMilestoneReached({
          type: 'user_count',
          milestone: reachedMilestone,
          currentValue: currentCount,
          adminUsers,
        });

        this.logger.log(`User milestone reached: ${reachedMilestone} (current: ${currentCount})`);
      }

      this.lastUserCount = currentCount;
    } catch (error) {
      this.logger.error(`Failed to check user milestone: ${error.message}`);
    }
  }

  async checkProcessingMilestone() {
    try {
      const currentCount = await this.candidateModel.countDocuments({ status: 'completed' });
      
      const reachedMilestone = this.PROCESSING_MILESTONES.find(
        milestone => currentCount >= milestone && this.lastProcessingCount < milestone
      );

      if (reachedMilestone) {
        const adminUsers = await this.getAdminUserIds();
        
        this.notificationEventService.emitProcessingMilestoneReached({
          type: 'processing_count',
          milestone: reachedMilestone,
          currentValue: currentCount,
          adminUsers,
        });

        this.logger.log(`Processing milestone reached: ${reachedMilestone} (current: ${currentCount})`);
      }

      this.lastProcessingCount = currentCount;
    } catch (error) {
      this.logger.error(`Failed to check processing milestone: ${error.message}`);
    }
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userModel.find({ role: UserRole.ADMIN }).select('_id').exec();
    return admins.map(admin => admin._id.toString());
  }
}
