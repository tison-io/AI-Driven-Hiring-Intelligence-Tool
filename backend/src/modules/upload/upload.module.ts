import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { LinkedInScraperService } from './services/linkedin-scraper.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [CandidatesModule, QueueModule],
  controllers: [UploadController],
  providers: [UploadService, LinkedInScraperService],
})
export class UploadModule {}