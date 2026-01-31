import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ApifyConfig } from "../../config/linkedinScraper.config";
import {
	ApifyLinkedInRequest,
	ApifyLinkedInResponse,
	LinkedInProfileData,
} from "./interfaces/linkedin-response.interface";
import { RapidApiResponse } from "./interfaces/linkedin-raw-api.interface";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import {
	RapidApiException,
	RateLimitExceededException,
	InvalidLinkedInUrlException,
	ProfileNotFoundException,
} from "./exceptions/linkedin-scraper.exceptions";

@Injectable()
export class ApifyService {
	private readonly logger = new Logger(ApifyService.name);

	constructor(
		private readonly httpService: HttpService,
		private readonly apifyConfig: ApifyConfig
	) { }

	async scrapeLinkedInProfiles(
		profileUrls: string[]
	): Promise<LinkedInProfileData[]> {
		if (!profileUrls || profileUrls.length === 0) {
			throw new HttpException(
				"Profile URLs are required",
				HttpStatus.BAD_REQUEST
			);
		}

		const results: LinkedInProfileData[] = [];

		try {
			this.logger.log(`Scraping ${profileUrls.length} LinkedIn profiles`);

			for (const url of profileUrls) {
				const profileData = await this.makeRapidApiRequest(url);
				results.push(profileData);
			}

			this.logger.log(`Successfully scraped ${results.length} profiles`);
			return results;
		} catch (error) {
			this.logger.error(
				"Failed to scrape LinkedIn profiles",
				error.stack
			);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				"Failed to scrape LinkedIn profiles",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	private async makeRapidApiRequest(
		profileUrl: string
	): Promise<LinkedInProfileData> {
		const headers = {
			"x-rapidapi-key": this.apifyConfig.rapidApiKey,
			"x-rapidapi-host":
				"linkdapi-best-unofficial-linkedin-api.p.rapidapi.com",
		};

		let lastError: any;

		for (
			let attempt = 1;
			attempt <= this.apifyConfig.maxRetries;
			attempt++
		) {
			try {
				this.logger.debug(`Attempt ${attempt} to call RapidAPI`);
				this.logger.debug(`Using API key: ${this.apifyConfig.rapidApiKey?.substring(0, 10)}...`);
				this.logger.debug(`Endpoint: ${this.apifyConfig.linkedinScraperEndpoint}`);

				// Validate and extract username from LinkedIn URL
				this.validateLinkedInUrl(profileUrl);
				const username = this.extractUsername(profileUrl);
				this.logger.debug(`Extracted username: ${username}`);

				const response: AxiosResponse = await firstValueFrom(
					this.httpService.get(
						`${this.apifyConfig.linkedinScraperEndpoint}?username=${username}`,
						{
							headers,
							timeout: this.apifyConfig.requestTimeout,
						}
					)
				);

				this.logger.debug(
					"Raw RapidAPI response:",
					JSON.stringify(response.data, null, 2)
				);

				// Handle API response errors
				this.handleApiResponse(response.data, profileUrl);

				// Transform RapidAPI response to match existing interface
				const data = response.data.data;
				const firstName = data.firstName || "";
				const lastName = data.lastName || "";
				const fullName = `${firstName} ${lastName}`.trim();

				const transformedData: LinkedInProfileData = {
					url: profileUrl,
					fullName,
					firstName,
					lastName,
					headline: data.headline || "",
					location: data.geo?.full || "",
					photoUrl: data.profilePicture || "",
					description: data.summary || "",
					followerCount: 0,
					connectionCount: 0,
					mutualConnectionsCount: 0,
					experiences: data.position || data.fullPositions || [],
					educations: data.educations || [],
					skills: data.skills || [],
					languages: data.languages || [],
					certifications: data.certifications || [],
				};

				return transformedData;
			} catch (error) {
				lastError = error;
				this.logger.warn(`Attempt ${attempt} failed:`, error.message);

				// Don't retry for certain error types
				if (error.response?.status === 403) {
					throw new HttpException('LinkedIn API access forbidden', HttpStatus.FORBIDDEN);
				}
				if (error.response?.status === 429) {
					throw new RateLimitExceededException();
				}
				// Don't retry for invalid URL errors - fail immediately
				if (error instanceof InvalidLinkedInUrlException) {
					throw error;
				}

				if (attempt < this.apifyConfig.maxRetries) {
					// Exponential backoff with jitter
					const baseDelay = Math.pow(2, attempt) * 1000;
					const jitter = Math.random() * 1000;
					const delay = baseDelay + jitter;
					this.logger.debug(`Retrying in ${Math.round(delay)}ms...`);
					await this.sleep(delay);
				}
			}
		}

		throw new HttpException(
			`All ${this.apifyConfig.maxRetries} attempts failed. Last error: ${lastError.message}`,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	// Validate LinkedIn URL format
	private validateLinkedInUrl(url: string): void {
		const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?(?:\?.*)?$/;
		if (!linkedinRegex.test(url)) {
			throw new InvalidLinkedInUrlException(url);
		}
	}

	// Extract username from LinkedIn URL
	private extractUsername(url: string): string {
		const match = url.match(/\/in\/([a-zA-Z0-9\-]+)/);
		const username = match?.[1] || "";
		if (!username) {
			throw new InvalidLinkedInUrlException(url);
		}
		return username;
	}

	// Handle API response and check for errors
	private handleApiResponse(responseData: RapidApiResponse, profileUrl: string): void {
		if (responseData.success === false) {
			if (responseData.message?.includes('rate limit')) {
				throw new RateLimitExceededException();
			}
			if (responseData.message?.includes('not found')) {
				throw new ProfileNotFoundException(profileUrl);
			}
			throw new RapidApiException(responseData.message || 'API request failed');
		}

		// Check if profile data exists
		if (!responseData.data) {
			throw new ProfileNotFoundException(profileUrl);
		}
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}


}
