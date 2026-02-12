import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JobPosting, JobPostingDocument } from './entities/job-posting.entity';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { ApplyJobDto } from './dto/apply-job.dto';

@Injectable()
export class JobPostingsService {
  constructor(
    @InjectModel(JobPosting.name)
    private jobPostingModel: Model<JobPostingDocument>,
    private configService: ConfigService,
  ) {}

  async create(createDto: CreateJobPostingDto, companyId: string) {
    const jobPosting = await this.jobPostingModel.create({
      ...createDto,
      companyId,
    });
    
    return {
      ...jobPosting.toObject(),
      shareableLink: this.generateShareableLink(jobPosting._id.toString()),
    };
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

    const dataWithLinks = data.map(job => ({
      ...job.toObject(),
      shareableLink: this.generateShareableLink(job._id.toString()),
    }));

    return {
      data: dataWithLinks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }
    
    return {
      ...jobPosting.toObject(),
      shareableLink: this.generateShareableLink(jobPosting._id.toString()),
    };
  }

  async update(id: string, updateDto: UpdateJobPostingDto, userId: string, userRole: string): Promise<JobPostingDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    if (userRole !== 'admin' && jobPosting.companyId.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only update your own job postings');
    }

    Object.assign(jobPosting, updateDto);
    return jobPosting.save();
  }

  async delete(id: string, userId: string, userRole: string): Promise<{ success: boolean; message: string }> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    if (userRole !== 'admin' && jobPosting.companyId.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only delete your own job postings');
    }

    await this.jobPostingModel.findByIdAndDelete(id).exec();

    return {
      success: true,
      message: 'Job posting deleted successfully',
    };
  }

  async toggleActive(id: string, userId: string, userRole: string): Promise<JobPostingDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException(`Job posting with ID ${id} not found`);
    }

    if (userRole !== 'admin' && jobPosting.companyId.toString() !== userId.toString()) {
      throw new ForbiddenException('You can only toggle your own job postings');
    }

    jobPosting.isActive = !jobPosting.isActive;
    return jobPosting.save();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private generateShareableLink(jobId: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    return `${frontendUrl}/apply/${jobId}`;
  }

  async getPublicJobPosting(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Job posting not found');
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    if (!jobPosting.isActive) {
      throw new NotFoundException('This job posting is no longer accepting applications');
    }
    
    return {
      _id: jobPosting._id,
      title: jobPosting.title,
      description: jobPosting.description,
      requirements: jobPosting.requirements,
      location: jobPosting.location,
      salary: jobPosting.salary,
    };
  }
}