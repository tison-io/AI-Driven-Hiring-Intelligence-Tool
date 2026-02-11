import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
import { Candidate, CandidateDocument } from "./entities/candidate.entity";
import { CandidateFilterDto } from "./dto/candidate-filter.dto";
import { NotificationEventService } from '../notifications/notification-event.service';
import { MilestoneDetectionService } from '../notifications/automation/milestone-detection.service';

@Injectable()
export class CandidatesService {
	constructor(
		@InjectModel(Candidate.name)
		private candidateModel: Model<CandidateDocument>,
		private notificationEventService: NotificationEventService,
		private milestoneDetectionService: MilestoneDetectionService,
	) {}

	async findAll(
		filters: CandidateFilterDto,
		userId: string,
		userRole: string,
	): Promise<CandidateDocument[]> {
		const query: FilterQuery<CandidateDocument> =
			userRole === "admin" ? {} : { createdBy: userId };

		if (filters.search) {
			query.$or = [
				{ name: { $regex: filters.search, $options: "i" } },
				{ skills: { $regex: filters.search, $options: "i" } },
				{ jobRole: { $regex: filters.search, $options: "i" } },
			];
		}

		if (filters.skill) {
			query.skills = { $regex: filters.skill, $options: "i" };
		}

		if (
			filters.confidenceMin !== undefined ||
			filters.confidenceMax !== undefined
		) {
			query.confidenceScore = {};
			if (filters.confidenceMin !== undefined) {
				query.confidenceScore.$gte = filters.confidenceMin;
			}
			if (filters.confidenceMax !== undefined) {
				query.confidenceScore.$lte = filters.confidenceMax;
			}
		}

		if (filters.createdAfter || filters.createdBefore) {
			query.createdAt = {};
			if (filters.createdAfter)
				query.createdAt.$gte = new Date(filters.createdAfter);
			if (filters.createdBefore)
				query.createdAt.$lte = new Date(filters.createdBefore);
		}

		if (filters.status) {
			query.status = filters.status;
		}

		if (
			filters.experience_min !== undefined ||
			filters.experience_max !== undefined
		) {
			query.experienceYears = {};
			if (filters.experience_min !== undefined) {
				query.experienceYears.$gte = filters.experience_min;
			}
			if (filters.experience_max !== undefined) {
				query.experienceYears.$lte = filters.experience_max;
			}
		}

		if (
			filters.score_min !== undefined ||
			filters.score_max !== undefined
		) {
			query.roleFitScore = {};
			if (filters.score_min !== undefined) {
				query.roleFitScore.$gte = filters.score_min;
			}
			if (filters.score_max !== undefined) {
				query.roleFitScore.$lte = filters.score_max;
			}
		}

		if (filters.jobRole) {
			query.jobRole = { $regex: filters.jobRole, $options: "i" };
		}

		// Educatioin Level filter
		if (filters.educationLevel) {
			query["education.degree_level"] = {
				$regex: filters.educationLevel,
				$options: "i",
			};
		}

		// Certification filter - handle both array and single value
		if (filters.certifications && filters.certifications.length > 0) {
			query.certifications = {
				$in: filters.certifications.map(cert => new RegExp(this.escapeRegex(cert), 'i'))
			};
		} else if (filters.certification) {
			query.certifications = {
				$regex: this.escapeRegex(filters.certification),
				$options: "i",
			};
		}

		// Required Skills filter (must have all skills)
		if (filters.requiredSkills && filters.requiredSkills.length > 0) {
			query.skills = {
				$all: filters.requiredSkills.map(
					(skill) => new RegExp(this.escapeRegex(skill), "i"),
				),
			};
		}

		// Previous company filter - handle both array and single value
		if (filters.companies && filters.companies.length > 0) {
			query['workExperience.company'] = {
				$in: filters.companies.map(company => new RegExp(this.escapeRegex(company), 'i'))
			};
		} else if (filters.previousCompany) {
			query["workExperience.company"] = {
				$regex: this.escapeRegex(filters.previousCompany),
				$options: "i",
			};
		}

		// Sorting
		const sortOptions: any = {};
		if (filters.sortBy) {
			const sortField =
				filters.sortBy === "score" ? "roleFitScore" : filters.sortBy;
			sortOptions[sortField] = filters.sortOrder === "asc" ? 1 : -1;
		} else {
			sortOptions.createdAt = -1; // default sort
		}
		// Always add secondary sort by _id for consistent ordering
		sortOptions._id = 1;

		return this.candidateModel.find(query).sort(sortOptions).exec();
	}

	async findById(id: string): Promise<CandidateDocument | null> {
		return this.candidateModel.findById(id).exec();
	}

	async create(
		candidateData: Partial<Candidate>,
	): Promise<CandidateDocument> {
		// Check for potential duplicates before creating
		await this.checkForDuplicates(candidateData);

		const candidate = new this.candidateModel(candidateData);
		const savedCandidate = await candidate.save();

		// Emit new application event
		this.notificationEventService.emitNewApplication({
			candidateId: savedCandidate._id.toString(),
			candidateName: savedCandidate.name || 'New Candidate',
			userId: savedCandidate.createdBy,
			jobRole: savedCandidate.jobRole,
		});

		return savedCandidate;
	}

	async update(
		id: string,
		updateData: Partial<Candidate>,
	): Promise<CandidateDocument | null> {
		const updatedCandidate = await this.candidateModel
			.findByIdAndUpdate(id, updateData, { new: true })
			.exec();

		// Check for processing milestone if status changed to completed
		if (updateData.status === 'completed') {
			await this.milestoneDetectionService.checkProcessingMilestone();
		}

		return updatedCandidate;
	}

	async findByUserId(userId: string): Promise<CandidateDocument[]> {
		// Return only candidates created by this specific user
		return this.candidateModel.find({ createdBy: userId }).exec();
	}

	async deleteByUserId(userId: string): Promise<void> {
		// Delete only candidates created by this specific user
		await this.candidateModel.deleteMany({ createdBy: userId }).exec();
	}

	async delete(id: string): Promise<{ success: boolean; message: string }> {
		const result = await this.candidateModel.findByIdAndDelete(id).exec();

		if (!result) {
			throw new NotFoundException("Candidate not found");
		}

		return {
			success: true,
			message: "Candidate and all PII data deleted successfully",
		};
	}

	async toggleShortlist(id: string): Promise<CandidateDocument> {
		const candidate = await this.candidateModel.findById(id).exec();

		if (!candidate) {
			throw new NotFoundException("Candidate not found");
		}

		const wasShortlisted = candidate.isShortlisted;
		candidate.isShortlisted = !candidate.isShortlisted;
		const savedCandidate = await candidate.save();

		// Emit shortlisted event when adding to shortlist
		if (!wasShortlisted && savedCandidate.isShortlisted) {
			this.notificationEventService.emitCandidateShortlisted({
				candidateId: savedCandidate._id.toString(),
				candidateName: savedCandidate.name || 'Candidate',
				userId: savedCandidate.createdBy,
				action: 'shortlisted',
			});
		}
		// Emit event when removing from shortlist
		else if (wasShortlisted && !savedCandidate.isShortlisted) {
			this.notificationEventService.emitCandidateRemovedFromShortlist({
				candidateId: savedCandidate._id.toString(),
				candidateName: savedCandidate.name || 'Candidate',
				userId: savedCandidate.createdBy,
				action: 'removed_from_shortlist',
			});
		}

		return savedCandidate;
	}

	async getFilterOptions(userId: string, userRole: string) {
		const query = userRole === "admin" ? {} : { createdBy: userId };

		const [certifications, companies, skills] = await Promise.all([
			this.candidateModel.distinct("certifications", query),
			this.candidateModel.distinct("workExperience.company", query),
			this.candidateModel.distinct("skills", query),
		]);

		return {
			certifications: [
				...new Set(
					certifications
						.filter(Boolean)
						.map((c: string) => c.toUpperCase()),
				),
			],
			companies: [
				...new Set(
					companies
						.filter(Boolean)
						.map((c: string) => c.toUpperCase()),
				),
			],
			skills: [
				...new Set(
					skills
						.filter(Boolean)
						.map((s: string) => s.toUpperCase()),
				),
			],
		};
	}

	private escapeRegex(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	private async checkForDuplicates(candidateData: Partial<Candidate>): Promise<void> {
		const query: FilterQuery<CandidateDocument> = {
			createdBy: candidateData.createdBy,
		};

		// Check for LinkedIn URL duplicates
		if (candidateData.linkedinUrl) {
			query.linkedinUrl = candidateData.linkedinUrl;
			const existingCandidate = await this.candidateModel.findOne(query).exec();
			
			if (existingCandidate) {
				this.notificationEventService.emitDuplicateFound({
					candidateId: existingCandidate._id.toString(),
					candidateName: candidateData.name || 'Candidate',
					userId: candidateData.createdBy,
					action: 'duplicate_found',
					duplicateDetails: {
						type: 'linkedin_url',
						existingCandidateId: existingCandidate._id.toString(),
						existingCandidateName: existingCandidate.name,
						linkedinUrl: candidateData.linkedinUrl,
					},
				});
			}
		}

		// Check for similar names (basic similarity check)
		if (candidateData.name && candidateData.name.length > 3) {
			const similarCandidates = await this.candidateModel.find({
				createdBy: candidateData.createdBy,
				name: { $regex: this.escapeRegex(candidateData.name), $options: 'i' },
			}).exec();

			if (similarCandidates.length > 0) {
				for (const similar of similarCandidates) {
					this.notificationEventService.emitDuplicateFound({
						candidateId: similar._id.toString(),
						candidateName: candidateData.name,
						userId: candidateData.createdBy,
						action: 'duplicate_found',
						duplicateDetails: {
							type: 'similar_name',
							existingCandidateId: similar._id.toString(),
							existingCandidateName: similar.name,
							similarityScore: this.calculateNameSimilarity(candidateData.name, similar.name),
						},
					});
				}
			}
		}
	}

	private calculateNameSimilarity(name1: string, name2: string): number {
		// Simple similarity calculation (can be improved with more sophisticated algorithms)
		const longer = name1.length > name2.length ? name1 : name2;
		const shorter = name1.length > name2.length ? name2 : name1;
		const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
		return ((longer.length - editDistance) / longer.length) * 100;
	}

	private levenshteinDistance(str1: string, str2: string): number {
		const matrix = [];
		for (let i = 0; i <= str2.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= str1.length; j++) {
			matrix[0][j] = j;
		}
		for (let i = 1; i <= str2.length; i++) {
			for (let j = 1; j <= str1.length; j++) {
				if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j] + 1
					);
				}
			}
		}
		return matrix[str2.length][str1.length];
	}
}
