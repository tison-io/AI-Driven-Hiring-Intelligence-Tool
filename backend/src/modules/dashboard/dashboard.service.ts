import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
	Candidate,
	CandidateDocument,
} from "../candidates/entities/candidate.entity";

@Injectable()
export class DashboardService {
	constructor(
		@InjectModel(Candidate.name)
		private candidateModel: Model<CandidateDocument>,
	) {}

	private getCurrentMonthDateRange() {
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
		return { startDate, endDate: now };
	}

	private getLastMonthDateRange() {
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const endDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			0,
			23,
			59,
			59,
		);
		return { startDate, endDate };
	}

	private calculatePercentageChange(current: number, previous: number) {
		if (previous === 0) return current > 0 ? 100 : 0;
		return Math.round(((current - previous) / previous) * 100 * 100) / 100;
	}

	private getTrend(percentageChange: number): "up" | "down" | "neutral" {
		if (percentageChange > 0) return "up";
		if (percentageChange < 0) return "down";
		return "neutral";
	}

	async getAdminDashboardMetrics() {
		const currentMonth = this.getCurrentMonthDateRange();
		const lastMonth = this.getLastMonthDateRange();

		// Current month metrics
		const currentProcessed = await this.candidateModel.countDocuments({
			status: "completed",
			createdAt: {
				$gte: currentMonth.startDate,
				$lte: currentMonth.endDate,
			},
		});

		const currentCompletedCandidates = await this.candidateModel
			.find({
				status: "completed",
				roleFitScore: { $exists: true, $ne: null },
				createdAt: {
					$gte: currentMonth.startDate,
					$lte: currentMonth.endDate,
				},
			})
			.select("roleFitScore");

		const currentAvgScore =
			currentCompletedCandidates.length > 0
				? currentCompletedCandidates.reduce(
						(sum, c) => sum + (c.roleFitScore || 0),
						0,
					) / currentCompletedCandidates.length
				: 0;

		const currentShortlisted = await this.candidateModel.countDocuments({
			isShortlisted: true,
			createdAt: {
				$gte: currentMonth.startDate,
				$lte: currentMonth.endDate,
			},
		});

		// Last month metrics
		const lastProcessed = await this.candidateModel.countDocuments({
			status: "completed",
			createdAt: { $gte: lastMonth.startDate, $lte: lastMonth.endDate },
		});

		const lastCompletedCandidates = await this.candidateModel
			.find({
				status: "completed",
				roleFitScore: { $exists: true, $ne: null },
				createdAt: {
					$gte: lastMonth.startDate,
					$lte: lastMonth.endDate,
				},
			})
			.select("roleFitScore");

		const lastAvgScore =
			lastCompletedCandidates.length > 0
				? lastCompletedCandidates.reduce(
						(sum, c) => sum + (c.roleFitScore || 0),
						0,
					) / lastCompletedCandidates.length
				: 0;

		const lastShortlisted = await this.candidateModel.countDocuments({
			isShortlisted: true,
			createdAt: { $gte: lastMonth.startDate, $lte: lastMonth.endDate },
		});

		// Calculate changes
		const processedChange = this.calculatePercentageChange(
			currentProcessed,
			lastProcessed,
		);
		const scoreChange = this.calculatePercentageChange(
			currentAvgScore,
			lastAvgScore,
		);
		const shortlistedChange = this.calculatePercentageChange(
			currentShortlisted,
			lastShortlisted,
		);

		// Get system health metrics
		const systemHealth = await this.getSystemHealthMetrics();

		return {
			totalCandidatesProcessed: {
				current: currentProcessed,
				percentageChange: processedChange,
				trend: this.getTrend(processedChange),
			},
			averageRoleFitScore: {
				current: Math.round(currentAvgScore * 100) / 100,
				percentageChange: scoreChange,
				trend: this.getTrend(scoreChange),
			},
			totalShortlisted: {
				current: currentShortlisted,
				percentageChange: shortlistedChange,
				trend: this.getTrend(shortlistedChange),
			},
			systemHealth,
		};
	}

	async getDashboardMetrics(userId: string, userRole: string) {
		const query = userRole === "admin" ? {} : { createdBy: userId };

		const queryUserId = userRole === "admin" ? undefined : userId;

		const totalCandidates = await this.candidateModel.countDocuments(query);

		const completedCandidates = await this.candidateModel.find({
			...query,
			status: "completed",
			roleFitScore: { $exists: true, $ne: null },
		});

		const averageRoleFitScore =
			completedCandidates.length > 0
				? completedCandidates.reduce(
						(sum, candidate) => sum + (candidate.roleFitScore || 0),
						0,
					) / completedCandidates.length
				: 0;

		const shortlistCount = await this.candidateModel.countDocuments({
			...query,
			$or: [{ isShortlisted: true }, { roleFitScore: { $gte: 80 } }],
		});

		const processingCount = await this.candidateModel.countDocuments({
			...query,
			status: { $in: ["pending", "processing"] },
		});

		const recentCandidates = await this.candidateModel
			.find(query)
			.sort({ createdAt: -1 })
			.limit(5)
			.select("name jobRole roleFitScore status createdAt")
			.exec();

		const shortlistedCandidates = await this.candidateModel
			.find({
				...query,
				$or: [{ isShortlisted: true }, { roleFitScore: { $gte: 80 } }],
			})
			.sort({ createdAt: -1 })
			.limit(5)
			.select("name jobRole roleFitScore createdAt")
			.exec();

		const [
			highQualityRate,
			confidenceAverage,
			biasAlerts,
			sourceAnalysis,
			scoreDistribution,
		] = await Promise.all([
			this.getHighQualityCandidatesRate(queryUserId),
			this.getConfidenceScoreAverage(queryUserId),
			this.getBiasDetectionAlerts(queryUserId),
			this.getResumeSourceAnalysis(queryUserId),
			this.getScoreDistribution(queryUserId),
		]);

		return {
			totalCandidates,
			averageRoleFitScore: Math.round(averageRoleFitScore * 100) / 100,
			shortlistCount,
			processingCount,
			recentCandidates,
			shortlistedCandidates,
			highQualityRate,
			confidenceAverage,
			biasAlerts,
			sourceAnalysis,
			scoreDistribution,
		};
	}

	async getSystemHealthMetrics() {
		const completedCandidates = await this.candidateModel
			.find({
				status: "completed",
				processingTime: { $exists: true, $ne: null },
			})
			.select("processingTime");

		const avgProcessingTime =
			completedCandidates.length > 0
				? completedCandidates.reduce(
						(sum, c) => sum + (c.processingTime || 0),
						0,
					) / completedCandidates.length
				: 0;

		const failedCount = await this.candidateModel.countDocuments({
			status: "failed",
		});
		const totalProcessed = await this.candidateModel.countDocuments({
			status: { $in: ["completed", "failed"] },
		});
		const successRate =
			totalProcessed > 0
				? ((totalProcessed - failedCount) / totalProcessed) * 100
				: 100;

		return {
			averageProcessingTime: Math.round(avgProcessingTime),
			successRate: Math.round(successRate * 100) / 100,
			failedProcessingCount: failedCount,
		};
	}

	async getHighQualityCandidatesRate(userId?: string) {
		const query = userId ? { createdBy: userId } : {};
		const totalCompleted = await this.candidateModel.countDocuments({
			...query,
			status: "completed",
			roleFitScore: { $exists: true, $ne: null },
		});

		const highQuality = await this.candidateModel.countDocuments({
			...query,
			status: "completed",
			roleFitScore: { $gte: 80 },
		});

		return totalCompleted > 0
			? Math.round((highQuality / totalCompleted) * 100)
			: 0;
	}

	async getConfidenceScoreAverage(userId?: string) {
		const query = userId ? { createdBy: userId } : {};
		const candidates = await this.candidateModel
			.find({
				...query,
				status: "completed",
				confidenceScore: { $exists: true, $ne: null },
			})
			.select("confidenceScore");

		return candidates.length > 0
			? Math.round(
					candidates.reduce(
						(sum, c) => sum + (c.confidenceScore || 0),
						0,
					) / candidates.length,
				)
			: 0;
	}

	async getBiasDetectionAlerts(userId?: string) {
		const query = userId ? { createdBy: userId } : {};
		return await this.candidateModel.countDocuments({
			...query,
			biasCheck: { 
				$exists: true, 
				$nin: [null, ""], 
				$not: /^No significant bias detected/i
			},
		});
	}

	async getResumeSourceAnalysis(userId?: string) {
		const query = userId ? { createdBy: userId } : {};

		const linkedinCandidates = await this.candidateModel
			.find({
				...query,
				linkedinUrl: { $exists: true, $ne: null },
				status: "completed",
				roleFitScore: { $exists: true, $ne: null },
			})
			.select("roleFitScore");

		const fileCandidates = await this.candidateModel
			.find({
				...query,
				fileUrl: { $exists: true, $ne: null },
				status: "completed",
				roleFitScore: { $exists: true, $ne: null },
			})
			.select("roleFitScore");

		const linkedinAvg =
			linkedinCandidates.length > 0
				? linkedinCandidates.reduce(
						(sum, c) => sum + (c.roleFitScore || 0),
						0,
					) / linkedinCandidates.length
				: 0;

		const fileAvg =
			fileCandidates.length > 0
				? fileCandidates.reduce(
						(sum, c) => sum + (c.roleFitScore || 0),
						0,
					) / fileCandidates.length
				: 0;

		return {
			linkedin: {
				count: linkedinCandidates.length,
				averageScore: Math.round(linkedinAvg * 100) / 100,
			},
			file: {
				count: fileCandidates.length,
				averageScore: Math.round(fileAvg * 100) / 100,
			},
		};
	}

	async getScoreDistribution(userId?: string) {
		const query = userId ? { createdBy: userId } : {};

		const candidates = await this.candidateModel
			.find({
				...query,
				roleFitScore: { $exists: true, $ne: null },
			})
			.select("roleFitScore");

		const distribution = {
			"0-20": 0,
			"21-40": 0,
			"41-60": 0,
			"61-80": 0,
			"81-100": 0,
		};

		candidates.forEach((candidate) => {
			const score = candidate.roleFitScore || 0;
			if (score <= 20) distribution["0-20"]++;
			else if (score <= 40) distribution["21-40"]++;
			else if (score <= 60) distribution["41-60"]++;
			else if (score <= 80) distribution["61-80"]++;
			else distribution["81-100"]++;
		});

		return distribution;
	}
}
