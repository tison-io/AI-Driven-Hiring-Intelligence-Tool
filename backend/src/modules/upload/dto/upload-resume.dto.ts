import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadResumeDto {
  @ApiProperty({ example: 'Backend Engineer' })
  @IsNotEmpty()
  @IsString()
  jobRole: string;
}