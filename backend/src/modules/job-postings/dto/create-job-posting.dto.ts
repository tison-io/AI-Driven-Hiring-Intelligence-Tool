import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateJobPostingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsString()
  location: string;

  @IsOptional()
  @IsObject()
  salary?: {
    min: number;
    max: number;
    currency: string;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}