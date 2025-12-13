import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrevoConfig {
  constructor(private configService: ConfigService) {}

  get apiKey(): string {
    return this.configService.get<string>('BREVO_API_KEY');
  }

  get fromEmail(): string {
    return (
      this.configService.get<string>('BREVO_FROM_EMAIL') ||
      'tenbitedaniel60@gmail.com'
    );
  }

  get fromName(): string {
    return this.configService.get<string>('BREVO_FROM_NAME') || 'TalentScanAI';
  }
}
