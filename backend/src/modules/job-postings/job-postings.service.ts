import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobPosting, JobPostingDocument } from './entities/job-posting.entity';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';

@Injectable()
export class JobPostingsService {
  constructor(
    @InjectModel(JobPosting.name)
    private jobPostingModel: Model<JobPostingDocument>,
  ) {}

  async create(createDto: CreateJobPostingDto, companyId: string): Promise<JobPostingDocument> {
    const jobPosting = new this.jobPostingModel({
      ...createDto,
      companyId,
    });
    return jobPosting.save();
  }
}