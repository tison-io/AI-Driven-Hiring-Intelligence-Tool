import { IsString, IsDateString, IsIn } from 'class-validator';
import { Expose } from 'class-transformer';

export class ErrorLogResponseDto {
  @Expose()
  @IsString()
  id: string;

  @Expose()
  @IsDateString()
  timestamp: Date;

  @Expose()
  @IsString()
  userOrSystem: string;

  @Expose()
  @IsString()
  action: string;

  @Expose()
  @IsString()
  target: string;

  @Expose()
  @IsString()
  details: string;

  @Expose()
  @IsIn(['info', 'warning', 'error', 'critical'])
  severity: string;
}

export class PaginatedErrorLogsResponseDto {
  data: ErrorLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
