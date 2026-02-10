import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { JobPostingsService } from './job-postings.service';

@Controller('api/job-postings')
@UseGuards(JwtAuthGuard)
export class JobPostingsController {
  constructor(private jobPostingsService: JobPostingsService) {}

  @Post()
  async create(@Body() createDto: CreateJobPostingDto, @Request() req: any) {
    return this.jobPostingsService.create(createDto, req.user._id);
  }
}