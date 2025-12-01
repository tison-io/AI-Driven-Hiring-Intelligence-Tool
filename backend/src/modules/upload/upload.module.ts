import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { QueueModule } from '../queue/queue.module';
import { ApifyModule } from '../apify/apify.module';

@Module({
  imports: [CandidatesModule, QueueModule, ApifyModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}