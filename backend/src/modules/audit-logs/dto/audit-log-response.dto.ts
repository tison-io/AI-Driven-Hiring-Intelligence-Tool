import { IsString, IsDateString } from 'class-validator';
import { Expose } from 'class-transformer';

export class AuditLogResponseDto {
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
}

export class PaginatedAuditLogsResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}