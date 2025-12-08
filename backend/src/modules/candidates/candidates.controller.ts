import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import { CandidateFilterDto } from './dto/candidate-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Candidates')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/candidates')
export class CandidatesController {
  constructor(private candidatesService: CandidatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all candidates with optional filters' })
  @ApiResponse({ status: 200, description: 'List of candidates retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'skill', required: false, description: 'Filter by skill keyword' })
  @ApiQuery({ name: 'experience_min', required: false, description: 'Minimum years of experience' })
  @ApiQuery({ name: 'experience_max', required: false, description: 'Maximum years of experience' })
  @ApiQuery({ name: 'score_min', required: false, description: 'Minimum role fit score (0-100)' })
  @ApiQuery({ name: 'score_max', required: false, description: 'Maximum role fit score (0-100)' })
  @ApiQuery({ name: 'jobRole', required: false, description: 'Filter by job role' })
  async findAll(@Query() filters: CandidateFilterDto, @Request() req) {
    return this.candidatesService.findAll(filters, req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  @ApiResponse({ status: 200, description: 'Candidate details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findById(@Param('id') id: string) {
    return this.candidatesService.findById(id);
  }
}