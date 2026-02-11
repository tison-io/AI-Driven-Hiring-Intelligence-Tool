import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SalaryDto } from './salary.dto';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SalaryDto)
  salary?: SalaryDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}