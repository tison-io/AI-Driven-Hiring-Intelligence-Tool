import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalaryDto } from './salary.dto';

export class CreateJobPostingDto {
  @ApiProperty({
    description: 'Job title',
    example: 'Senior Backend Engineer',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed job description',
    example: 'We are looking for an experienced backend engineer to join our team. You will work on building scalable APIs and microservices.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'List of job requirements',
    example: ['5+ years of Node.js experience', 'Experience with MongoDB', 'Strong understanding of REST APIs'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @ApiProperty({
    description: 'Job location',
    example: 'San Francisco, CA (Remote available)',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    description: 'Salary range (optional)',
    type: () => SalaryDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary?: SalaryDto;

  @ApiPropertyOptional({
    description: 'Whether the job posting is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}