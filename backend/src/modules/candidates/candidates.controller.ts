import {
	Controller,
	Get,
	Delete,
	Patch,
	Param,
	Query,
	UseGuards,
	Request,
	Body,
} from "@nestjs/common";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiQuery,
	ApiParam,
} from "@nestjs/swagger";
import { CandidatesService } from "./candidates.service";
import { CandidateFilterDto } from "./dto/candidate-filter.dto";
import { UpdateHiringStatusDto } from './dto/update-hiring-status.dto';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Candidates")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("api/candidates")
export class CandidatesController {
	constructor(private candidatesService: CandidatesService) {}

	@Get('filter-options')
	@ApiOperation({ summary: "Get available filter options from processed candidates" })
	@ApiResponse({
		status: 200,
		description: "Filter options retrieved successfully",
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async getFilterOptions(@Request() req) {
		return this.candidatesService.getFilterOptions(
			req.user.id,
			req.user.role,
		);
	}

	@Get()
	@ApiOperation({ summary: "Get all candidates with optional filters" })
	@ApiResponse({
		status: 200,
		description: "List of candidates retrieved successfully",
	})
	@ApiResponse({ status: 401, description: "Unauthorized" })
	@ApiQuery({
		name: "skill",
		required: false,
		description: "Filter by skill keyword",
	})
	@ApiQuery({
		name: "experience_min",
		required: false,
		description: "Minimum years of experience",
	})
	@ApiQuery({
		name: "experience_max",
		required: false,
		description: "Maximum years of experience",
	})
	@ApiQuery({
		name: "score_min",
		required: false,
		description: "Minimum role fit score (0-100)",
	})
	@ApiQuery({
		name: "score_max",
		required: false,
		description: "Maximum role fit score (0-100)",
	})
	@ApiQuery({
		name: "jobRole",
		required: false,
		description: "Filter by job role",
	})
	@ApiQuery({
		name: "search",
		required: false,
		description: "Search across name, skills, and job role",
	})
	@ApiQuery({ name: "sortBy", required: false, description: "Sort by field" })
	@ApiQuery({
		name: "sortOrder",
		required: false,
		description: "Sort order (asc or desc)",
	})
	@ApiQuery({
		name: "educationLevel",
		required: false,
		description: "Filter by education level",
	})
	@ApiQuery({
		name: "certification",
		required: false,
		description: "Filter by certification",
	})
	@ApiQuery({
		name: "requiredSkills",
		required: false,
		description: "Filter by required skills (array)",
	})
	@ApiQuery({
		name: "previousCompany",
		required: false,
		description: "Filter by previous company",
	})
	async findAll(@Query() filters: CandidateFilterDto, @Request() req) {
		return this.candidatesService.findAll(
			filters,
			req.user.id,
			req.user.role,
		);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get candidate by ID" })
	@ApiResponse({
		status: 200,
		description: "Candidate details retrieved successfully",
	})
	@ApiResponse({ status: 404, description: "Candidate not found" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async findById(@Param("id") id: string) {
		return this.candidatesService.findById(id);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete candidate and all PII data" })
	@ApiResponse({ status: 200, description: "Candidate deleted successfully" })
	@ApiResponse({ status: 404, description: "Candidate not found" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async delete(@Param("id") id: string) {
		return this.candidatesService.delete(id);
	}

	@Patch(":id/shortlist")
	@ApiOperation({ summary: "Toggle candidate shortlist status" })
	@ApiResponse({
		status: 200,
		description: "Shortlist status updated successfully",
	})
	@ApiResponse({ status: 404, description: "Candidate not found" })
	@ApiResponse({ status: 401, description: "Unauthorized" })
	async toggleShortlist(@Param("id") id: string) {
		return this.candidatesService.toggleShortlist(id);
	}

	@Patch(':id/hiring-status')
	@ApiOperation({ summary: 'Update candidate hiring status' })
	@ApiParam({ name: 'id', description: 'Candidate ID' })
	@ApiResponse({
		status: 200,
		description: 'Hiring status updated successfully',
	})
	@ApiResponse({ status: 404, description: 'Candidate not found' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async updateHiringStatus(
		@Param('id') id: string,
		@Body() dto: UpdateHiringStatusDto,
		@Request() req: any,
	) {
		return this.candidatesService.updateHiringStatus(
			id,
			dto.hiringStatus,
			dto.notes,
		);
	}

	@Patch('bulk/hiring-status')
	@ApiOperation({ summary: 'Bulk update hiring status' })
	@ApiResponse({
		status: 200,
		description: 'Bulk hiring status updated successfully',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async bulkUpdateHiringStatus(
		@Body() dto: { candidateIds: string[]; hiringStatus: string },
		@Request() req: any,
	) {
		const results = await Promise.all(
			dto.candidateIds.map(id =>
				this.candidatesService.updateHiringStatus(id, dto.hiringStatus),
			),
		);
		return {
			success: true,
			updated: results.length,
			message: `${results.length} candidates updated`,
		};
	}
}
