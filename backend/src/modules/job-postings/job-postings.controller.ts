import { Controller, Post, Body, UseGuards, Request, Get, Query, Param, Put, Delete, Patch, UseInterceptors, UploadedFile, NotFoundException, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { FindAllJobPostingsDto } from './dto/find-all-job-postings.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { JobPostingsService } from './job-postings.service';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { UploadService } from '../upload/upload.service';
import { JobPostingStatus } from './entities/job-posting.entity';

@ApiTags('Job Postings')
@Controller('api/job-postings')
export class JobPostingsController {
  constructor(
    private jobPostingsService: JobPostingsService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new job posting',
    description: 'Creates a new job posting. The companyId is automatically set from the authenticated user.',
  })
  @ApiBody({ type: CreateJobPostingDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Job posting created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        title: 'Senior Backend Engineer',
        description: 'We are looking for an experienced backend engineer...',
        responsibilities: ['Design and develop backend systems', 'Lead architecture reviews'],
        requiredSkills: ['Node.js', 'MongoDB', 'AWS', 'Docker'],
        location: 'San Francisco, CA',
        experienceLevel: 'senior',
        employmentType: 'full-time',
        closingDate: '2024-12-31',
        companyName: 'TechStar Recruiters',
        salary: { min: 120000, max: 180000, currency: 'USD' },
        companyId: '507f191e810c19729de860ea',
        isActive: true,
        applicationToken: 'abc123...',
        shareableLink: 'http://localhost:3001/apply/abc123...',
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  async create(@Body() createDto: CreateJobPostingDto, @Request() req: any) {
    return this.jobPostingsService.create(createDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all job postings',
    description: 'Retrieves a paginated list of job postings with optional search filtering by title, description, or location.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for title, description, or location' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job postings retrieved successfully',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            title: 'Senior Backend Engineer',
            description: 'We are looking for an experienced backend engineer...',
            responsibilities: ['Design and develop backend systems'],
            requiredSkills: ['Node.js', 'MongoDB'],
            location: 'San Francisco, CA',
            experienceLevel: 'senior',
            employmentType: 'full-time',
            companyName: 'TechStar Recruiters',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  async findAll(@Query() query: FindAllJobPostingsDto) {
    return this.jobPostingsService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search
    });
  }

  // PUBLIC ENDPOINTS - Must come before :id routes to avoid conflicts

  @Get('apply/:token')
  @ApiTags('Public Application')
  @ApiOperation({ 
    summary: 'Get job posting for public application (No Auth)',
    description: 'Public endpoint to fetch job details for candidates using application token.',
  })
  @ApiParam({ name: 'token', description: 'Application token' })
  @ApiResponse({ status: 200, description: 'Job details retrieved' })
  @ApiResponse({ status: 404, description: 'Job not found or inactive' })
  async getPublicJobPosting(@Param('token') token: string) {
    return this.jobPostingsService.getPublicJobPostingByToken(token);
  }

  @Post('apply/:token')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  }))
  @ApiTags('Public Application')
  @ApiOperation({ summary: 'Submit application (No Auth)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'token', description: 'Application token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
        file: { type: 'string', format: 'binary' },
        source: { type: 'string', example: 'file', enum: ['file', 'linkedin'] },
      },
      required: ['name', 'email', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @ApiResponse({ status: 404, description: 'Job not found or inactive' })
  async submitApplication(
    @Param('token') token: string,
    @Body() applyDto: ApplyJobDto,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    // Get job posting by token
    const jobPosting = await this.jobPostingsService.getPublicJobPostingByToken(token);
    
    // Get full job posting details (includes companyId)
    const fullJobPosting = await this.jobPostingsService.findOne(jobPosting._id.toString());
    
    if (fullJobPosting.status !== JobPostingStatus.ACTIVE) {
      throw new NotFoundException('This job posting is no longer accepting applications');
    }

    // Ensure companyId exists before processing
    if (!fullJobPosting.companyId) {
      throw new BadRequestException('Missing companyId for job posting');
    }

    const result = await this.uploadService.processResume(
      file,
      fullJobPosting.title,
      fullJobPosting.companyId.toString(),
      fullJobPosting.description,
      {
        ...applyDto,
        jobPostingId: fullJobPosting._id.toString(),
      },
    );
    return {
      candidateId: result.candidateId,
      message: 'Application submitted successfully. We\'re evaluating your profile and will email results shortly.',
      status: result.status,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get a single job posting by ID',
    description: 'Retrieves detailed information about a specific job posting.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the job posting', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job posting retrieved successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        title: 'Senior Backend Engineer',
        description: 'We are looking for an experienced backend engineer...',
        responsibilities: ['Design and develop backend systems', 'Lead architecture reviews'],
        requiredSkills: ['Node.js', 'MongoDB', 'AWS', 'Docker'],
        location: 'San Francisco, CA',
        experienceLevel: 'senior',
        employmentType: 'full-time',
        closingDate: '2024-12-31',
        companyName: 'TechStar Recruiters',
        salary: { min: 120000, max: 180000, currency: 'USD' },
        companyId: '507f191e810c19729de860ea',
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.jobPostingsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update a job posting',
    description: 'Updates an existing job posting. Only the owner (recruiter who created it) or an admin can update the posting.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the job posting', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateJobPostingDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Job posting updated successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        title: 'Senior Backend Engineer (Updated)',
        description: 'Updated description...',
        responsibilities: ['Design and develop backend systems'],
        requiredSkills: ['Node.js', 'MongoDB'],
        location: 'San Francisco, CA',
        experienceLevel: 'senior',
        employmentType: 'full-time',
        isActive: true,
        updatedAt: '2024-01-15T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own job postings' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateJobPostingDto,
    @Request() req: any,
  ) {
    return this.jobPostingsService.update(id, updateDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete a job posting',
    description: 'Permanently deletes a job posting. Only the owner (recruiter who created it) or an admin can delete the posting.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the job posting', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: 200, 
    description: 'Job posting deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Job posting deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own job postings' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  async delete(@Param('id', ParseObjectIdPipe) id: string, @Request() req: any) {
    return this.jobPostingsService.delete(id, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update job posting status',
    description: 'Change status between draft, active, and inactive. Only the owner or an admin can update the status.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId of the job posting', example: '507f1f77bcf86cd799439011' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string', 
          enum: ['draft', 'active', 'inactive'],
          example: 'active'
        }
      },
      required: ['status']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Job posting status updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own job postings' })
  @ApiResponse({ status: 404, description: 'Job posting not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  async updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('status') status: JobPostingStatus,
    @Request() req: any,
  ) {
    return this.jobPostingsService.updateStatus(id, status, req.user.id, req.user.role);
  }
}