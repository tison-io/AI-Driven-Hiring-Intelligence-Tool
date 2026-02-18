import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPosting, JobPostingSchema } from './entities/job-posting.entity';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingsService } from './job-postings.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosting.name, schema: JobPostingSchema },
    ]),
    forwardRef(() => UploadModule),
  ],
  controllers: [JobPostingsController],
  providers: [JobPostingsService],
  exports: [MongooseModule, JobPostingsService],
})
export class JobPostingsModule {}