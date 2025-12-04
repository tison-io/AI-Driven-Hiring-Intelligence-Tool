import { IsString, IsOptional, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicExperienceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PublicEducationDto {
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class PublicSkillDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class LinkedInPublicDataDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicExperienceDto)
  experiences: PublicExperienceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicEducationDto)
  educations: PublicEducationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicSkillDto)
  skills: PublicSkillDto[];
}