import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ApifyConfig } from "../../config/linkedinScraper.config";
import {
	ApifyLinkedInRequest,
	ApifyLinkedInResponse,
	LinkedInProfileData,
} from "./interfaces/linkedin-response.interface";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";

@Injectable()
export class ApifyService {
	private readonly logger = new Logger(ApifyService.name);

	constructor(
		private readonly httpService: HttpService,
		private readonly apifyConfig: ApifyConfig
	) {}

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

				// Extract username from LinkedIn URL
				const username =
					profileUrl.split("/in/")[1]?.replace("/", "") || "";
				if (!username) {
					throw new Error("Invalid LinkedIn URL format");
				}

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

				// Transform RapidAPI response to match your existing interface
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

				// Check for 403 Forbidden or 429 Rate Limit - use mock data
				if (error.response?.status === 403 || error.response?.status === 429) {
					const errorType = error.response?.status === 403 ? 'API access forbidden' : 'Rate limit exceeded';
					this.logger.warn(`${errorType}, falling back to mock data`);
					return this.generateMockLinkedInData(profileUrl);
				}

				if (attempt < this.apifyConfig.maxRetries) {
					const delay = Math.pow(2, attempt) * 1000;
					this.logger.debug(`Retrying in ${delay}ms...`);
					await this.sleep(delay);
				}
			}
		}

		// Final fallback for 403/429 errors
		if (lastError?.response?.status === 403 || lastError?.response?.status === 429) {
			const errorType = lastError?.response?.status === 403 ? 'API access forbidden' : 'rate limiting';
			this.logger.warn(`All attempts failed due to ${errorType}, using mock data`);
			return this.generateMockLinkedInData(profileUrl);
		}

		throw new HttpException(
			`All ${this.apifyConfig.maxRetries} attempts failed. Last error: ${lastError.message}`,
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private generateMockLinkedInData(profileUrl: string): LinkedInProfileData {
		const username = profileUrl.split('/in/')[1]?.replace('/', '') || 'unknown';
		
		return {
			url: profileUrl,
			fullName: `Mock User (${username})`,
			firstName: 'Mock',
			lastName: 'User',
			headline: 'Software Engineer | Full Stack Developer',
			location: 'San Francisco, CA',
			photoUrl: '',
			description: `Mock LinkedIn profile data for ${username}. API access forbidden - using placeholder data.`,
			followerCount: Math.floor(Math.random() * 1000) + 500,
			connectionCount: Math.floor(Math.random() * 500) + 100,
			mutualConnectionsCount: Math.floor(Math.random() * 50),
			experiences: [
				{
					title: 'Senior Software Engineer',
					company: 'Tech Company',
					duration: '2+ years',
					description: 'Full stack development with React and Node.js'
				}
			],
			educations: [
				{
					school: 'University of Technology',
					degree: 'Bachelor of Computer Science',
					year: '2020'
				}
			],
			skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
			languages: ['English'],
			certifications: []
		};
	}
}
