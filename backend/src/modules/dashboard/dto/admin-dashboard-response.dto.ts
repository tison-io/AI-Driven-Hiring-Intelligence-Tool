import { ApiProperty } from '@nestjs/swagger';

export class MetricWithChange {
  @ApiProperty({ example: 150 })
  current: number;

  @ApiProperty({ example: 12.5 })
  percentageChange: number;

  @ApiProperty({ enum: ['up', 'down', 'neutral'], example: 'up' })
  trend: 'up' | 'down' | 'neutral';
}

export class SystemHealthDto {
  @ApiProperty({
    example: 2500,
    description: 'Average processing time in milliseconds',
  })
  averageProcessingTime: number;

  @ApiProperty({ example: 95.5, description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({
    example: 3,
    description: 'Number of failed processing attempts',
  })
  failedProcessingCount: number;
}

export class AdminDashboardResponseDto {
  @ApiProperty({ type: MetricWithChange })
  totalCandidatesProcessed: MetricWithChange;

  @ApiProperty({ type: MetricWithChange })
  averageRoleFitScore: MetricWithChange;

  @ApiProperty({ type: MetricWithChange })
  totalShortlisted: MetricWithChange;

  @ApiProperty({ type: SystemHealthDto })
  systemHealth: SystemHealthDto;
}
