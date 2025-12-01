import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApifyConfig } from '../../config/apify.config';
import { 
  ApifyLinkedInRequest, 
  ApifyLinkedInResponse, 
  LinkedInProfileData 
} from './interfaces/linkedin-response.interface';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly apifyConfig: ApifyConfig,
  ) {}

  async scrapeLinkedInProfiles(profileUrls: string[]): Promise<LinkedInProfileData[]> {
    if (!profileUrls || profileUrls.length === 0) {
      throw new HttpException('Profile URLs are required', HttpStatus.BAD_REQUEST);
    }

    const requestPayload: ApifyLinkedInRequest = {
      profileUrls,
      proxyConfiguration: {
        useApifyProxy: true,
      },
    };

    try {
      this.logger.log(`Scraping ${profileUrls.length} LinkedIn profiles`);
      
      const response = await this.makeApifyRequest(requestPayload);
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new HttpException('Invalid response from Apify', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.logger.log(`Successfully scraped ${response.data.length} profiles`);
      return response.data;

    } catch (error) {
      this.logger.error('Failed to scrape LinkedIn profiles', error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to scrape LinkedIn profiles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async makeApifyRequest(payload: ApifyLinkedInRequest): Promise<ApifyLinkedInResponse> {
    const headers = {
      'Authorization': `Bearer ${this.apifyConfig.token}`,
      'Content-Type': 'application/json',
    };

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.apifyConfig.maxRetries; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt} to call Apify API`);
        
        const response: AxiosResponse = await firstValueFrom(
          this.httpService.post(
            this.apifyConfig.linkedinScraperEndpoint,
            payload,
            {
              headers,
              timeout: this.apifyConfig.requestTimeout,
            }
          )
        );

        // Log the actual response structure for debugging
        this.logger.debug('Raw Apify response:', JSON.stringify(response.data, null, 2));

        return {
          data: response.data,
          success: true,
        };

      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.apifyConfig.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.debug(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new HttpException(
      `All ${this.apifyConfig.maxRetries} attempts failed. Last error: ${lastError.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}