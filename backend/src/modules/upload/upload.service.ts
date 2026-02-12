import { Injectable, HttpException, HttpStatus, Logger, BadRequestException } from "@nestjs/common";
import { CandidatesService } from "../candidates/candidates.service";
import { QueueService } from "../queue/queue.service";
import { ApifyService } from "../linkedin-scraper/linkedinScraper.service";
import { LinkedInMapper } from "../linkedin-scraper/mappers/linkedin-mapper";
import { ProcessingStatus } from "../../common/enums/processing-status.enum";
import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";

@Injectable()
export class UploadService {
	private readonly logger = new Logger(UploadService.name);

	constructor(
		private candidatesService: CandidatesService,
		private queueService: QueueService,
		private apifyService: ApifyService,
		private linkedInMapper: LinkedInMapper
	) {}

	async processResume(file: Express.Multer.File, jobRole: string, userId: string, jobDescription?: string) {
		// Extract text from file
		const rawText = await this.extractTextFromFile(file);

		// Create candidate record
		const candidate = await this.candidatesService.create({
			name: "Extracted from Resume", // Will be updated by AI
			rawText,
			jobRole,
			source: 'file',
			...(jobDescription && { jobDescription }),
			status: ProcessingStatus.PENDING,
			createdBy: userId,
		});

		// Add to AI processing queue
		await this.queueService.addAIProcessingJob(
			candidate._id.toString(),
			jobRole,
			jobDescription,
			userId
		);

		return {
			candidateId: candidate._id,
			message: "Resume uploaded successfully. Processing started.",
			status: "pending",
		};
	}

	async processLinkedinProfile(linkedinUrl: string, jobRole: string, userId: string, jobDescription?: string) {
		try {
			this.logger.log(`Processing LinkedIn profile: ${linkedinUrl}`);

			// Scrape LinkedIn profile using Apify
			const profileData = await this.apifyService.scrapeLinkedInProfiles([
				linkedinUrl,
			]);

			if (!profileData || profileData.length === 0) {
				throw new HttpException(
					"Failed to scrape LinkedIn profile",
					HttpStatus.BAD_REQUEST
				);
			}

			// Transform scraped data
			const transformedProfiles =
				await this.linkedInMapper.transformMultipleProfiles(
					profileData
				);

			if (transformedProfiles.length === 0) {
				throw new HttpException(
					"Failed to process LinkedIn profile data",
					HttpStatus.BAD_REQUEST
				);
			}

			const profile = transformedProfiles[0];
			const rawText = this.formatLinkedInData(profile);

			// Create candidate record
			const candidate = await this.candidatesService.create({
				name: profile.fullName,
				linkedinUrl,
				rawText,
				jobRole,
				source: 'linkedin',
				...(jobDescription && { jobDescription }),
				status: ProcessingStatus.PENDING,
				createdBy: userId,
			});

			// Add to AI processing queue
			await this.queueService.addAIProcessingJob(
				candidate._id.toString(),
				jobRole,
				jobDescription,
				userId
			);

			return {
				candidateId: candidate._id,
				message:
					"LinkedIn profile processed successfully. AI analysis started.",
				status: "pending",
			};
		} catch (error) {
			this.logger.error(
				"Failed to process LinkedIn profile",
				error.stack
			);

			if (error instanceof HttpException) {
				throw error;
			}

			throw new HttpException(
				"Failed to process LinkedIn profile",
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	private async extractTextFromFile(
		file: Express.Multer.File
	): Promise<string> {
		if (file.mimetype === "application/pdf") {
			const data = await pdfParse(file.buffer);
			return data.text;
		} else if (file.mimetype.includes("word")) {
			const result = await mammoth.extractRawText({
				buffer: file.buffer,
			});
			return result.value;
		}
		throw new BadRequestException("Unsupported file type");
	}

	private formatLinkedInData(profile: any): string {
		const sections = [
			`Name: ${profile.fullName}`,
			profile.headline ? `Headline: ${profile.headline}` : "",
			profile.location ? `Location: ${profile.location}` : "",
		].filter(Boolean);

		if (profile.experiences?.length > 0) {
			sections.push("\nExperience:");
			profile.experiences.forEach((exp: any) => {
				sections.push(`- ${exp.title} at ${exp.company}`);
				if (exp.startDate || exp.endDate) {
					sections.push(
						`  ${exp.startDate || ""} - ${exp.endDate || "Present"}`
					);
				}
				if (exp.description) {
					sections.push(`  ${exp.description}`);
				}
			});
		}

		if (profile.educations?.length > 0) {
			sections.push("\nEducation:");
			profile.educations.forEach((edu: any) => {
				sections.push(`- ${edu.schoolName}`);
				if (edu.degree) sections.push(`  ${edu.degree}`);
				if (edu.fieldOfStudy) sections.push(`  ${edu.fieldOfStudy}`);
			});
		}

		if (profile.skills?.length > 0) {
			sections.push("\nSkills:");
			sections.push(
				profile.skills.map((skill: any) => skill.name).join(", ")
			);
		}

		return sections.join("\n");
	}
}
