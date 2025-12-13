import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Technical Recruiter' })
  @IsNotEmpty()
  @IsString()
  jobTitle: string;

  @ApiProperty({ example: 'Tech Corp Inc.' })
  @IsNotEmpty()
  @IsString()
  companyName: string;
}
