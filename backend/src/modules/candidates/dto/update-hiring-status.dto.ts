import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHiringStatusDto {
  @ApiProperty({
    enum: ['to_review', 'shortlisted', 'rejected', 'hired'],
    example: 'shortlisted',
  })
  @IsEnum(['to_review', 'shortlisted', 'rejected', 'hired'])
  hiringStatus: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
