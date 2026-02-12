import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateJobPostingDto } from './create-job-posting.dto';

export class UpdateJobPostingDto extends PartialType(CreateJobPostingDto) {
  @ApiPropertyOptional({
    description: 'Job title',
    example: 'Senior Backend Engineer',
  })
  title?: string;

  @ApiPropertyOptional({
    description: 'Detailed job description',
    example: 'We are looking for an experienced backend engineer to join our team.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'List of job requirements',
    example: ['5+ years of Node.js experience', 'Experience with MongoDB'],
    type: [String],
  })
  requirements?: string[];

  @ApiPropertyOptional({
    description: 'Job location',
    example: 'San Francisco, CA (Remote available)',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Whether the job posting is active',
    example: true,
  })
  isActive?: boolean;
}
