import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";
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

		// Certification filter
		if (filters.certification) {
			query.certifications = {
				$regex: filters.certification,
				$options: "i",
			};
		}

		// Required Skills filter (must have all skills)
		if (filters.requiredSkills && filters.requiredSkills.length > 0) {
			query.skills = {
				$all: filters.requiredSkills.map(
					(skill) => new RegExp(skill, "i"),
				),
			};
		}
		// Previous company filter
		if (filters.previousCompany) {
			query["workExperience.company"] = {
				$regex: filters.previousCompany,
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
		// For now, return all candidates since we don't have userId field in candidates
		// In production, you'd add a userId field to candidate schema
		return this.candidateModel.find().exec();
	}

	async deleteByUserId(userId: string): Promise<void> {
		// For now, this is a placeholder
		// In production, you'd delete candidates where userId matches
		await this.candidateModel.deleteMany({}).exec();
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
}
