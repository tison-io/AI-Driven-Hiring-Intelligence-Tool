import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyJobDto {
  @ApiProperty({
    description: 'Candidate full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Application source type',
    example: 'resume',
    enum: ['resume', 'linkedin'],
    default: 'resume',
  })
  @IsOptional()
  @IsString()
  @IsIn(['resume', 'linkedin'])
  source?: string;
}
