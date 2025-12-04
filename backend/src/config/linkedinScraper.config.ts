import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApifyConfig {
  constructor(private configService: ConfigService) {}

  get rapidApiKey(): string {
    return this.configService.get<string>('RAPIDAPI_KEY');
  }

  get baseUrl(): string {
    return 'https://linkdapi-best-unofficial-linkedin-api.p.rapidapi.com';
  }

  get linkedinScraperEndpoint(): string {
    return `${this.baseUrl}/api/v1/profile/full`;
  }

  get requestTimeout(): number {
    return 30000;
  }

  get maxRetries(): number {
    return 3;
  }
}