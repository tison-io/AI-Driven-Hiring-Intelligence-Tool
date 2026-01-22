import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "../../common/enums/user-role.enum";

@ApiTags("Dashboard")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("api/dashboard")
export class DashboardController {
	constructor(private dashboardService: DashboardService) {}

	@Get()
	@Roles(UserRole.ADMIN, UserRole.RECRUITER)
	@ApiOperation({ summary: "Get dashboard metrics and analytics" })
	@ApiResponse({
		status: 200,
		description: "Dashboard metrics retrieved successfully",
		schema: {
			type: "object",
			properties: {
				totalCandidates: { type: "number", example: 150 },
				averageRoleFitScore: { type: "number", example: 75.5 },
				shortlistCount: { type: "number", example: 25 },
				processingCount: { type: "number", example: 5 },
				highQualityRate: { type: "number", example: 68.5 },
				confidenceAverage: { type: "number", example: 85.2 },
				biasAlerts: { type: "array", example: [] },
				sourceAnalysis: { type: "object", example: {} },
				scoreDistribution: {
					type: "object",
					properties: {
						"0-20": { type: "number", example: 5 },
						"21-40": { type: "number", example: 15 },
						"41-60": { type: "number", example: 30 },
						"61-80": { type: "number", example: 45 },
						"81-100": { type: "number", example: 25 },
					},
				},
				recentCandidates: {
					type: "array",
					items: {
						type: "object",
						properties: {
							name: { type: "string" },
							jobRole: { type: "string" },
							roleFitScore: { type: "number" },
							status: { type: "string" },
							createdAt: { type: "string" },
						},
					},
				},
			},
		},
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({
		status: 403,
		description: "Forbidden - insufficient permissions",
	})
	async getDashboardMetrics(@Request() req) {
		return this.dashboardService.getDashboardMetrics(
			req.user.id,
			req.user.role,
		);
	}

	@Get("admin")
	@Roles(UserRole.ADMIN)
	@ApiOperation({
		summary: "Get admin dashboard metrics with month-over-month comparison",
	})
	@ApiResponse({
		status: 200,
		description: "Admin dashboard metrics retrieved successfully",
		schema: {
			type: "object",
			properties: {
				totalCandidatesProcessed: {
					type: "object",
					properties: {
						current: { type: "number", example: 150 },
						percentageChange: { type: "number", example: 12.5 },
						trend: {
							type: "string",
							enum: ["up", "down", "neutral"],
							example: "up",
						},
					},
				},
				averageRoleFitScore: {
					type: "object",
					properties: {
						current: { type: "number", example: 75.5 },
						percentageChange: { type: "number", example: -3.2 },
						trend: {
							type: "string",
							enum: ["up", "down", "neutral"],
							example: "down",
						},
					},
				},
				totalShortlisted: {
					type: "object",
					properties: {
						current: { type: "number", example: 45 },
						percentageChange: { type: "number", example: 8.0 },
						trend: {
							type: "string",
							enum: ["up", "down", "neutral"],
							example: "up",
						},
					},
				},
				systemHealth: {
					type: "object",
					properties: {
						averageProcessingTime: {
							type: "number",
							example: 2500,
							description:
								"Average processing time in milliseconds",
						},
						successRate: {
							type: "number",
							example: 95.5,
							description: "Success rate percentage",
						},
						failedProcessingCount: {
							type: "number",
							example: 3,
							description: "Number of failed processing attempts",
						},
					},
				},
			},
		},
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({
		status: 403,
		description: "Forbidden - Admin access required",
	})
	async getAdminDashboardMetrics() {
		return this.dashboardService.getAdminDashboardMetrics();
	}

	@Get("score-distribution")
	@Roles(UserRole.ADMIN)
	@ApiOperation({ summary: "Get role fit score distribution (Admin only)" })
	@ApiResponse({
		status: 200,
		description: "Score distribution retrieved successfully",
		schema: {
			type: "object",
			properties: {
				"0-20": { type: "number", example: 5 },
				"21-40": { type: "number", example: 15 },
				"41-60": { type: "number", example: 30 },
				"61-80": { type: "number", example: 45 },
				"81-100": { type: "number", example: 25 },
			},
		},
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiResponse({
		status: 403,
		description: "Forbidden - Admin access required",
	})
	async getScoreDistribution() {
		return this.dashboardService.getScoreDistribution();
	}

	@Get("/analytics")
	@UseGuards(JwtAuthGuard)
	async getAnalytics(@Request() req) {
		const userId = req.user.id;
		const userRole = req.user.role;

		const queryUserId = userRole === "admin" ? undefined : userId;

		return {
			scoreDistribution:
				await this.dashboardService.getScoreDistribution(queryUserId),
			biasAlerts:
				await this.dashboardService.getBiasDetectionAlerts(queryUserId),
			sourceAnalysis:
				await this.dashboardService.getResumeSourceAnalysis(
					queryUserId,
				),
			highQualityRate:
				await this.dashboardService.getHighQualityCandidatesRate(
					queryUserId,
				),
			confidenceAverage:
				await this.dashboardService.getConfidenceScoreAverage(
					queryUserId,
				),
		};
	}
}
