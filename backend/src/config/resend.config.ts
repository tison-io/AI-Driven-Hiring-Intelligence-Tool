import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendConfig {
  constructor(private configService: ConfigService) {}

  get apiKey(): string {
    return this.configService.get<string>('RESEND_API_KEY');
  }

  get fromEmail(): string {
    return this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
  }
}
