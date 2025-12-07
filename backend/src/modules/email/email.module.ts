import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { ResendConfig } from '../../config/resend.config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, ResendConfig],
  exports: [EmailService],
})
export class EmailModule {}
