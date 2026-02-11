import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import { Candidate, CandidateDocument } from "./entities/candidate.entity";
import { CandidateFilterDto } from "./dto/candidate-filter.dto";

@Injectable()
export class CandidatesService {
	constructor(
		@InjectModel(Candidate.name)
		private candidateModel: Model<CandidateDocument>,
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
		const candidate = new this.candidateModel(candidateData);
		return candidate.save();
	}

	async update(
		id: string,
		updateData: Partial<Candidate>,
	): Promise<CandidateDocument | null> {
		return this.candidateModel
			.findByIdAndUpdate(id, updateData, { new: true })
			.exec();
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

		candidate.isShortlisted = !candidate.isShortlisted;
		return candidate.save();
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

	async updateMany(
		filter: Partial<{ status: string; jobPostingId: string }>,
		update: Partial<{ status: string; isShortlisted: boolean }>,
		userId: string,
		userRole: string,
	): Promise<any> {
		const allowedFilterKeys = ['status', 'jobPostingId'];
		const allowedUpdateKeys = ['status', 'isShortlisted'];

		if (Object.keys(filter).length === 0 && userRole !== 'admin') {
			throw new BadRequestException('Empty filter not allowed');
		}

		const sanitizedFilter: any = {};
		for (const key of Object.keys(filter)) {
			if (allowedFilterKeys.includes(key)) {
				const value = filter[key];
				if (value !== undefined) {
					if (key === 'jobPostingId') {
						if (!Types.ObjectId.isValid(value)) {
							throw new BadRequestException('Invalid jobPostingId');
						}
					}
					sanitizedFilter[key] = value;
				}
			}
		}

		if (userRole !== 'admin') {
			sanitizedFilter.createdBy = userId;
		}

		if (Object.keys(sanitizedFilter).length === 0) {
			throw new BadRequestException('Empty filter not allowed');
		}

		const sanitizedUpdate: any = {};
		for (const key of Object.keys(update)) {
			if (allowedUpdateKeys.includes(key)) {
				const value = update[key];
				if (value !== undefined) {
					sanitizedUpdate[key] = value;
				}
			}
		}

		if (Object.keys(sanitizedUpdate).length === 0) {
			throw new BadRequestException('No valid update fields provided');
		}

		return this.candidateModel.updateMany(sanitizedFilter, { $set: sanitizedUpdate }).exec();
	}
}
