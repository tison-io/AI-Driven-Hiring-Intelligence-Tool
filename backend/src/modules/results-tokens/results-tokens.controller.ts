import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ResultsTokensService } from './results-tokens.service';

@ApiTags('Public Results')
@Controller('api/results')
export class ResultsTokensController {
  constructor(private resultsTokensService: ResultsTokensService) {}

  @Get(':token')
  @ApiOperation({ 
    summary: 'Get candidate results by token (No Auth)',
    description: 'Public endpoint for candidates to view their evaluation results using the token from email.',
  })
  @ApiParam({ name: 'token', description: 'Results token from email' })
  @ApiResponse({ status: 200, description: 'Results retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Token not found or expired' })
  async getResults(@Param('token') token: string) {
    const resultsToken = await this.resultsTokensService.validateToken(token);
    
    return {
      candidate: resultsToken.candidateId,
      jobPosting: resultsToken.jobPostingId,
      expiresAt: resultsToken.expiresAt,
    };
  }
}
