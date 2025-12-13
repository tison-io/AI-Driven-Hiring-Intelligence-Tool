import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { AiProcessor } from './processors/ai-processor';
import { CandidatesModule } from '../candidates/candidates.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-processing',
    }),
    CandidatesModule,
    AiModule,
  ],
  providers: [QueueService, AiProcessor],
  exports: [QueueService],
})
export class QueueModule {}
