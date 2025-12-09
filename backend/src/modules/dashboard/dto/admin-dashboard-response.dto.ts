import { ApiProperty } from '@nestjs/swagger';

export class MetricWithChange {
  @ApiProperty({ example: 150 })
  current: number;

  @ApiProperty({ example: 12.5 })
  percentageChange: number;

  @ApiProperty({ enum: ['up', 'down', 'neutral'], example: 'up' })
  trend: 'up' | 'down' | 'neutral';
}

export class AdminDashboardResponseDto {
  @ApiProperty({ type: MetricWithChange })
  totalCandidatesProcessed: MetricWithChange;

  @ApiProperty({ type: MetricWithChange })
  averageRoleFitScore: MetricWithChange;

  @ApiProperty({ type: MetricWithChange })
  totalShortlisted: MetricWithChange;
}
