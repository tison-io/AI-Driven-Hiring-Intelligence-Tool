import { Controller, Get, Param, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery,
  ApiParam 
} from '@nestjs/swagger';
import { ExportService } from './export.service';
import { ExportCandidatesDto } from './dto/export-candidates.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Export')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('candidates')
  @ApiOperation({ summary: 'Export candidates data as CSV or XLSX' })
  @ApiQuery({ name: 'format', enum: ['csv', 'xlsx'], description: 'Export format' })
  @ApiQuery({ name: 'skill', required: false, description: 'Filter by skill keyword' })
  @ApiQuery({ name: 'experience_min', required: false, description: 'Minimum years of experience' })
  @ApiQuery({ name: 'experience_max', required: false, description: 'Maximum years of experience' })
  @ApiQuery({ name: 'score_min', required: false, description: 'Minimum role fit score (0-100)' })
  @ApiQuery({ name: 'score_max', required: false, description: 'Maximum role fit score (0-100)' })
  @ApiResponse({ status: 200, description: 'File exported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid export format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportCandidates(
    @Query() exportDto: ExportCandidatesDto,
    @Res() res: Response,
    @Request() req,
  ) {
    const { format, ...filters } = exportDto;
    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === 'csv') {
      buffer = await this.exportService.exportCandidatesCSV(filters, req.user.id, req.user.role);
      filename = `candidates-${new Date().toISOString().split('T')[0]}.csv`;
      contentType = 'text/csv';
    } else if (format === 'xlsx') {
      buffer = await this.exportService.exportCandidatesXLSX(filters, req.user.id, req.user.role);
      filename = `candidates-${new Date().toISOString().split('T')[0]}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      return res.status(400).json({ error: true, message: 'Invalid format. Use csv or xlsx' });
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return res.send(buffer);
  }

  @Get('report/:id')
  @ApiOperation({ summary: 'Generate detailed hiring intelligence report for a candidate' })
  @ApiParam({ name: 'id', description: 'Candidate ID' })
  @ApiResponse({ status: 200, description: 'Report generated successfully', content: { 'text/html': {} } })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateReport(@Param('id') candidateId: string, @Res() res: Response) {
    try {
      const htmlReport = await this.exportService.generateCandidateReport(candidateId);
      
      res.set({
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="candidate-report-${candidateId}.html"`,
      });

      return res.send(htmlReport);
    } catch (error) {
      return res.status(404).json({ 
        error: true, 
        message: error.message || 'Candidate not found' 
      });
    }
  }
}