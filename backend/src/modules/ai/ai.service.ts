import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async evaluateCandidateGraph(rawText: string, jobRole: string, jobDescription?: string) {
    try {
      this.logger.log('Starting LangGraph Evaluation via /analyze/graph');
      const startTime = Date.now();

      const formData = new FormData();
      formData.append('raw_text', rawText);
      formData.append('role_name', jobRole);
      formData.append('job_description', jobDescription || this.getJobDescription(jobRole));

      const response = await axios.post(
        `${this.aiServiceUrl}/analyze/graph`,
        formData,
        {
          headers: { ...formData.getHeaders() },
          timeout: 120000
        }
      );

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`Graph Analysis complete in ${processingTime}s`);

      const { final_score, summary, agent_reports, parsed_profile } = response.data;

      return this.transformGraphResponse(final_score, summary, agent_reports, parsed_profile);

    } catch (error) {
      this.handleError(error, 'LangGraph evaluation failed');
    }
  }

  private transformGraphResponse(finalScore: number, summary: any, agentReports: any, profile: any) {
    // Defensive null checks - use safe defaults for all response-derived objects
    const safeSummary = summary || {};
    const safeAgentReports = agentReports || {};
    const safeProfile = profile || {};

    // Initialize categoryScores with safe defaults and validate expected keys
    const categoryScores = safeSummary?.category_scores || {};
    const scoringBreakdown = {
      skill_match: categoryScores?.competency ?? 0,
      experience_relevance: categoryScores?.experience ?? 0,
      education_fit: categoryScores?.soft_skills ?? 0,
      certifications: categoryScores?.competency ?? 0
    };

    // Get candidate's actual skills (normalized to lowercase for comparison)
    const candidateSkills = (safeProfile?.skills || []).map((s: string) => s.toLowerCase().trim());

    // Filter out "missing" skills that the candidate actually has
    const reportedMissingSkills = safeAgentReports?.competency_agent?.missing_competencies || [];
    const actuallyMissingSkills = reportedMissingSkills.filter((skill: string) => {
      const normalizedSkill = skill.toLowerCase().trim();
      // Check if candidate has this skill (exact match or partial match)
      return !candidateSkills.some((candidateSkill: string) =>
        candidateSkill.includes(normalizedSkill) || normalizedSkill.includes(candidateSkill)
      );
    });

    // Guard all profile field accesses with optional chaining and fallback arrays
    const workExperience = (safeProfile?.work_experience || []).map((job: any) => ({
      company: job?.company || '',
      jobTitle: job?.job_title || '',
      startDate: job?.start_date || '',
      endDate: job?.end_date || '',
      description: job?.description || ''
    }));

    return {
      name: safeProfile?.candidate_name || 'Anonymous',
      email: safeProfile?.email || '',
      skills: safeProfile?.skills || [],
      experienceYears: safeProfile?.total_years_experience ?? 0,
      workExperience: workExperience,
      education: safeProfile?.education || [],
      certifications: safeProfile?.certifications || [],

      roleFitScore: finalScore ?? 0,
      isShortlisted: (finalScore ?? 0) >= 75,
      scoringBreakdown: scoringBreakdown,

      keyStrengths: safeSummary?.strengths || [],
      potentialWeaknesses: safeSummary?.weaknesses || [],
      missingSkills: actuallyMissingSkills,
      interviewQuestions: safeSummary?.interview_questions || [],

      confidenceScore: 90,
      biasCheck: "No bias detected"
    };
  }

  private getJobDescription(jobRole: string): string {
    return `Professional role requiring relevant technical skills and experience in ${jobRole}.`;
  }

  private handleError(error: any, context: string) {
    this.logger.error(context, error.stack);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(error.message || 'Internal AI Service Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}