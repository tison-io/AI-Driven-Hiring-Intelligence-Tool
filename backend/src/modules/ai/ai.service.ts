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
      certifications: safeAgentReports?.competency_agent?.score ?? categoryScores?.competency ?? 0
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

    // Calculate dynamic confidence score based on profile completeness
    const profileFields = [
      safeProfile?.candidate_name,
      safeProfile?.skills?.length > 0,
      safeProfile?.work_experience?.length > 0,
      safeProfile?.education?.length > 0,
      safeProfile?.total_years_experience != null
    ];
    const filledFields = profileFields.filter(Boolean).length;
    const profileCompleteness = (filledFields / profileFields.length) * 100;

    // Get evaluation scores for bias detection
    const competencyScore = categoryScores?.competency ?? 0;
    const experienceScore = categoryScores?.experience ?? 0;
    const softSkillsScore = categoryScores?.soft_skills ?? 0;
    const inferredJobFamily = safeAgentReports?.competency_agent?.inferred_job_family || '';

    // Check for explicit JD-Role mismatch from competency agent
    const explicitJdRoleMismatch = safeAgentReports?.competency_agent?.jd_role_mismatch === true;

    // Check for jurisdiction/licensing issues (qualified but wrong jurisdiction)
    const hasJurisdictionIssue = safeAgentReports?.competency_agent?.jurisdiction_issue === true;

    // Fallback detection: high experience/culture but zero/very low competency indicates mismatch
    // BUT only if there's no jurisdiction issue (jurisdiction issues aren't true mismatches)
    const hasHighExperienceOrCulture = experienceScore >= 70 || softSkillsScore >= 70;
    const hasVeryLowCompetency = competencyScore <= 10;
    const inferredJdRoleMismatch = hasHighExperienceOrCulture && hasVeryLowCompetency && !hasJurisdictionIssue;

    // Use explicit flag if available, otherwise use inferred detection
    const isJdRoleMismatch = explicitJdRoleMismatch || inferredJdRoleMismatch;

    // Detect other bias signals
    const hasMissingCriticalSkills = actuallyMissingSkills.length > 3;
    const hasVeryLowFinalScore = (finalScore ?? 0) < 40;

    // Calculate bias penalty
    let biasPenalty = 0;
    let biasReasons: string[] = [];

    if (isJdRoleMismatch) {
      biasPenalty = 70; // Maximum penalty for JD-Role mismatch
      biasReasons.push(`JD-Role mismatch detected (inferred: ${inferredJobFamily || 'unknown'})`);
    } else if (hasJurisdictionIssue) {
      // Jurisdiction issues get moderate penalty - candidate is qualified but needs license transfer
      biasPenalty = 50;
      biasReasons.push('Jurisdiction/licensing issue: candidate may need license transfer');
    }
    if (hasMissingCriticalSkills && !isJdRoleMismatch && !hasJurisdictionIssue) {
      biasPenalty = Math.max(biasPenalty, 30);
      biasReasons.push('Significant skill gaps detected');
    }
    if (hasVeryLowFinalScore && !isJdRoleMismatch && !hasJurisdictionIssue) {
      biasPenalty = Math.max(biasPenalty, 20);
      biasReasons.push('Low overall fit score');
    }

    // Apply bias penalty to confidence score
    const confidenceScore = Math.max(0, Math.min(100, Math.round(profileCompleteness - biasPenalty)));

    // Determine bias check status
    const biasCheck = biasReasons.length > 0
      ? `REVIEW REQUIRED: ${biasReasons.join('; ')}`
      : "No bias detected";

    return {
      name: safeProfile?.candidate_name || 'Anonymous',
      email: safeProfile?.email || '',
      skills: safeProfile?.skills || [],
      // Use relevant_years_validated from experience agent (more accurate for role fit)
      // Falls back to profile total_years_experience if not available
      experienceYears: safeAgentReports?.experience_agent?.relevant_years_validated ?? safeProfile?.total_years_experience ?? 0,
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

      confidenceScore: confidenceScore,
      biasCheck: biasCheck
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