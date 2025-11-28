import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkedinProfileDto {
  @ApiProperty({ example: 'https://www.linkedin.com/in/johndoe' })
  @IsNotEmpty()
  @IsUrl()
  linkedinUrl: string;

  @ApiProperty({ example: 'Backend Engineer' })
  @IsNotEmpty()
  @IsString()
  jobRole: string;
}