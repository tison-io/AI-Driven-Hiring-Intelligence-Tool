import { IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'newemail@test.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}