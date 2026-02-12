import { IsString, IsNotEmpty, IsOptional, IsIn, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyJobDto {
  @ApiProperty({
    description: 'Candidate full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Candidate email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Application source type',
    example: 'file',
    enum: ['file', 'linkedin'],
    default: 'file',
  })
  @IsOptional()
  @IsString()
  @IsIn(['file', 'linkedin'])
  source?: string;
}
