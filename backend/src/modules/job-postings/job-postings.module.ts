import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPosting, JobPostingSchema } from './entities/job-posting.entity';
import { JobPostingsController } from './job-postings.controller';
import { JobPostingsService } from './job-postings.service';
import { UploadModule } from '../upload/upload.module';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobPosting.name, schema: JobPostingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => UploadModule),
  ],
  controllers: [JobPostingsController],
  providers: [JobPostingsService],
  exports: [MongooseModule, JobPostingsService],
})
export class JobPostingsModule {}