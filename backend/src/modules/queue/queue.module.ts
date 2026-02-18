import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { AiProcessor } from './processors/ai-processor';
import { CandidatesModule } from '../candidates/candidates.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { ResultsTokensModule } from '../results-tokens/results-tokens.module';
import { JobPostingsModule } from '../job-postings/job-postings.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-processing',
    }),
    CandidatesModule,
    AiModule,
    NotificationsModule,
    EmailModule,
    ResultsTokensModule,
    AuditLogsModule,
    forwardRef(() => JobPostingsModule),
  ],
  providers: [QueueService, AiProcessor],
  exports: [QueueService],
})
export class QueueModule {}