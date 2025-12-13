import { IsNotEmpty, IsString, IsUrl, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkedinProfileDto {
  @ApiProperty({
    example: 'https://www.linkedin.com/in/johndoe',
    description: 'Valid LinkedIn profile URL',
  })
  @IsNotEmpty({ message: 'LinkedIn URL is required' })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @Matches(/^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/, {
    message:
      'Please provide a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)',
  })
  linkedinUrl: string;

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
