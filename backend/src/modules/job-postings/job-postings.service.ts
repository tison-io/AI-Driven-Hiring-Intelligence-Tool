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

  async findAll(options: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = options;
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.jobPostingModel.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      this.jobPostingModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}