import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadResumeDto {
  @ApiProperty({ example: 'Backend Engineer' })
  @IsNotEmpty()
  @IsString()
  jobRole: string;

  @ApiProperty({
    example:
      'Looking for a backend engineer with 3+ years experience in Node.js, MongoDB, and REST APIs',
    description: 'Job description and specific requirements',
  })
  @IsNotEmpty()
  @IsString()
  jobDescription: string;
}
