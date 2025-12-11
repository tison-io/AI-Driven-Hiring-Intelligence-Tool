import { IsOptional, IsString, IsDateString, IsIn, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ErrorLogFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'error', 'critical'])
  severity?: string;

  @IsOptional()
  @IsString()
  userOrSystem?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}