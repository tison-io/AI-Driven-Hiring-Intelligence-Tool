import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApifyConfig {
  constructor(private configService: ConfigService) {}

  get token(): string {
    return this.configService.get<string>('APIFY_TOKEN');
  }

  get baseUrl(): string {
    return 'https://api.apify.com/v2';
  }

  get linkedinScraperActorId(): string {
    return 'apimaestro~linkedin-profile-batch-scraper-no-cookies-required';
  }

  get linkedinScraperEndpoint(): string {
    return `${this.baseUrl}/acts/${this.linkedinScraperActorId}/run-sync-get-dataset-items`;
  }

  get requestTimeout(): number {
    return 30000; // 30 seconds
  }

  get maxRetries(): number {
    return 3;
  }
}