import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryService } from './cloudinary.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { QueueModule } from '../queue/queue.module';
import { ApifyModule } from '../linkedin-scraper/linkedinScraper.module';

@Module({
  imports: [CandidatesModule, QueueModule, ApifyModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
