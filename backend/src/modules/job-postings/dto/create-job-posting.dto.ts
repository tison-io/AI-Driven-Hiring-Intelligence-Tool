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

  @ApiPropertyOptional({
    description: 'List of job responsibilities',
    example: ['Design and develop backend systems', 'Lead architecture reviews', 'Mentor junior developers'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responsibilities?: string[];

  @ApiPropertyOptional({
    description: 'List of required skills',
    example: ['Node.js', 'MongoDB', 'AWS', 'Docker'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiProperty({
    description: 'Job location',
    example: 'San Francisco, CA (Remote available)',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({
    description: 'Experience level',
    example: 'senior',
    enum: ['entry', 'mid', 'senior', 'lead', 'principal'],
  })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiPropertyOptional({
    description: 'Employment type',
    example: 'full-time',
    enum: ['full-time', 'part-time', 'contract', 'internship'],
  })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({
    description: 'Job closing date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  closingDate?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'TechStar Recruiters',
  })
  @IsOptional()
  @IsString()
  companyName?: string;

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