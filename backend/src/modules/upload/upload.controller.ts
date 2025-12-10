import { 
  Controller, 
  Post, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards,
  Request 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody 
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { LinkedinProfileDto } from './dto/linkedin-profile.dto';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/candidates')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('upload-resume')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload resume file for processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Resume file (PDF or DOCX)',
        },
        jobRole: {
          type: 'string',
          example: 'Backend Engineer',
        },
        jobDescription: {
          type: 'string',
          example: 'Looking for a backend engineer with 3+ years experience',
          required: false,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or missing job role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadResume(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() uploadResumeDto: UploadResumeDto,
    @Request() req,
  ) {
    return this.uploadService.processResume(
      file, 
      uploadResumeDto.jobRole, 
      req.user.id,
      uploadResumeDto.jobDescription
    );
  }

  @Post('linkedin')
  @ApiOperation({ summary: 'Process LinkedIn profile URL' })
  @ApiResponse({ status: 201, description: 'LinkedIn profile processing started' })
  @ApiResponse({ status: 400, description: 'Invalid LinkedIn URL or missing job role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async processLinkedin(
    @Body() linkedinProfileDto: LinkedinProfileDto,
    @Request() req,
  ) {
    return this.uploadService.processLinkedinProfile(
      linkedinProfileDto.linkedinUrl,
      linkedinProfileDto.jobRole,
      req.user.id,
      linkedinProfileDto.jobDescription,
    );
  }
}