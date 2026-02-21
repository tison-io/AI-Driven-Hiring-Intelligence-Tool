import { IsEnum, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkUpdateHiringStatusDto {
  @ApiProperty({
    type: [String],
    description: 'Array of candidate IDs to update',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  })
  @IsArray()
  @ArrayMinSize(1)
  candidateIds: string[];

  @ApiProperty({
    enum: ['to_review', 'shortlisted', 'rejected', 'hired'],
    example: 'shortlisted',
    description: 'New hiring status for all selected candidates'
  })
  @IsEnum(['to_review', 'shortlisted', 'rejected', 'hired'])
  hiringStatus: string;
}
