import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JobPosting, JobPostingDocument, JobPostingStatus } from './entities/job-posting.entity';
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
    const applicationToken = crypto.randomBytes(16).toString('hex');
    
    const responsibilities = createDto.responsibilities?.length > 0 
      ? createDto.responsibilities 
      : this.extractResponsibilities(createDto.description);
    
    const requiredSkills = createDto.requiredSkills || [];
    
    const jobPosting = await this.jobPostingModel.create({
      ...createDto,
      responsibilities,
      requiredSkills,
      companyId,
      applicationToken,
      status: createDto.status || JobPostingStatus.DRAFT,
    });
    
    return {
      ...jobPosting.toObject(),
      shareableLink: this.generateShareableLink(jobPosting.applicationToken),
    };
  }

  private extractResponsibilities(description: string): string[] {
    const lines = description.split('\n');
    const responsibilities = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match lines starting with •, -, *, or numbers (1., 2., etc.)
      if (/^[•\-*]/.test(trimmed) || /^\d+\./.test(trimmed)) {
        const cleaned = trimmed
          .replace(/^[•\-*]\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .trim();
        if (cleaned) {
          responsibilities.push(cleaned);
        }
      }
    }
    
    return responsibilities;
  }

  async findAll(options: { page: number; limit: number; search?: string }, userId: string, userRole: string) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;
    
    const query: any = {};
    
    // Filter by companyId unless user is admin
    if (userRole !== 'admin') {
      query.companyId = userId;
    }
    
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
      shareableLink: this.generateShareableLink(job.applicationToken),
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
      shareableLink: this.generateShareableLink(jobPosting.applicationToken),
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

  async updateStatus(id: string, newStatus: JobPostingStatus, userId: string, userRole: string): Promise<JobPostingDocument> {
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

    jobPosting.status = newStatus;
    return jobPosting.save();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private generateShareableLink(token: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    return `${frontendUrl}/apply/${token}`;
  }

  async getPublicJobPostingByToken(token: string) {
    const jobPosting = await this.jobPostingModel.findOne({ 
      applicationToken: token,
      status: JobPostingStatus.ACTIVE
    }).exec();
    
    if (!jobPosting) {
      throw new NotFoundException('Job posting not found or not accepting applications');
    }
    
    return {
      _id: jobPosting._id,
      title: jobPosting.title,
      description: jobPosting.description,
      responsibilities: jobPosting.responsibilities,
      requiredSkills: jobPosting.requiredSkills,
      requirements: jobPosting.requirements,
      location: jobPosting.location,
      experienceLevel: jobPosting.experienceLevel,
      employmentType: jobPosting.employmentType,
      closingDate: jobPosting.closingDate,
      companyName: jobPosting.companyName,
      salary: jobPosting.salary,
    };
  }

  async getPublicJobPosting(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Job posting not found');
    }

    const jobPosting = await this.jobPostingModel.findById(id).exec();
    
    if (!jobPosting) {
      throw new NotFoundException('Job posting not found');
    }

    if (jobPosting.status !== JobPostingStatus.ACTIVE) {
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