import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { BrevoConfig } from '../../config/brevo.config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, BrevoConfig],
  exports: [EmailService],
})
export class EmailModule {}
