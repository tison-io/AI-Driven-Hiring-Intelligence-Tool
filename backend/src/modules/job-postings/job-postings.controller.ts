import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { FindAllJobPostingsDto } from './dto/find-all-job-postings.dto';
import { JobPostingsService } from './job-postings.service';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@Controller('api/job-postings')
@UseGuards(JwtAuthGuard)
export class JobPostingsController {
  constructor(private jobPostingsService: JobPostingsService) {}

  @Post()
  async create(@Body() createDto: CreateJobPostingDto, @Request() req: any) {
    return this.jobPostingsService.create(createDto, req.user._id);
  }

  @Get()
  async findAll(@Query() query: FindAllJobPostingsDto) {
    return this.jobPostingsService.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.jobPostingsService.findOne(id);
  }
}