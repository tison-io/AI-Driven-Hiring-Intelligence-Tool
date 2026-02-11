import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;
    
    const query: any = {};
    if (options.search) {
      const sanitized = this.escapeRegex(options.search.substring(0, 100));
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
        { location: { $regex: sanitized, $options: 'i' } },
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

  async findOne(id: string): Promise<JobPostingDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }
    
    return jobPosting;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}