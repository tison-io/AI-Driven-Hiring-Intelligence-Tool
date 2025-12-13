import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateFilterDto {
  @ApiPropertyOptional({ example: 'JavaScript' })
  @IsOptional()
  @IsString()
  skill?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experience_min?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experience_max?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score_min?: number;

  @ApiPropertyOptional({ example: 95 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score_max?: number;

  @ApiPropertyOptional({ example: 'Backend Engineer' })
  @IsOptional()
  @IsString()
  jobRole?: string;

  @ApiPropertyOptional({
    example: 'john',
    description: 'Search across name, skills, and job role',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
