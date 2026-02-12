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
    const safeSummary = summary || {};
    const safeAgentReports = agentReports || {};
    const safeProfile = profile || {};
    const categoryScores = safeSummary?.category_scores || {};
    const scoringBreakdown = {
      skill_match: categoryScores?.competency ?? 0,
      experience_relevance: categoryScores?.experience ?? 0,
      education_fit: categoryScores?.soft_skills ?? 0,
      certifications: safeAgentReports?.competency_agent?.score ?? categoryScores?.competency ?? 0
    };

    const candidateSkills = (safeProfile?.skills || []).map((s: string) => s.toLowerCase().trim());

    const missingCompetencies = safeAgentReports?.competency_agent?.missing_competencies || [];
    const missingRoleSkills = safeAgentReports?.behavioral_agent?.missing_role_skills || [];

    const allReportedMissingSkills = [...new Set([...missingCompetencies, ...missingRoleSkills])];

    const actuallyMissingSkills = allReportedMissingSkills.filter((skill: string) => {
      const normalizedSkill = skill.toLowerCase().trim();
      return !candidateSkills.some((candidateSkill: string) =>
        candidateSkill.includes(normalizedSkill) || normalizedSkill.includes(candidateSkill)
      );
    });
    const workExperience = (safeProfile?.work_experience || []).map((job: any) => ({
      company: job?.company || '',
      jobTitle: job?.job_title || '',
      startDate: job?.start_date || '',
      endDate: job?.end_date || '',
      description: job?.description || ''
    }));

    const profileFields = [
      safeProfile?.candidate_name,
      safeProfile?.skills?.length > 0,
      safeProfile?.work_experience?.length > 0,
      safeProfile?.education?.length > 0,
      safeProfile?.total_years_experience != null
    ];
    const filledFields = profileFields.filter(Boolean).length;
    const profileCompleteness = (filledFields / profileFields.length) * 100;

    const extractionConfidence = safeProfile?.extraction_confidence || {};
    const avgExtractionConfidence = (() => {
      const values = Object.values(extractionConfidence).filter(
        (v): v is number => typeof v === 'number'
      );
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0.5;
    })();

    const confidenceScore = Math.max(0, Math.min(100,
      Math.round((profileCompleteness + avgExtractionConfidence * 100) / 2)
    ));
    const competencyScore = categoryScores?.competency ?? 0;
    const experienceScore = categoryScores?.experience ?? 0;
    const softSkillsScore = categoryScores?.soft_skills ?? 0;
    const inferredJobFamily = safeAgentReports?.competency_agent?.inferred_job_family || '';

    let biasReasons: string[] = [];

    const explicitJdRoleMismatch = safeAgentReports?.competency_agent?.jd_role_mismatch === true;
    if (explicitJdRoleMismatch) {
      biasReasons.push(`JD-Role mismatch detected (inferred: ${inferredJobFamily || 'unknown'}) — candidate may be evaluated against wrong criteria`);
    }

    const competencyAgent = safeAgentReports?.competency_agent || {};
    const matchedCount = (competencyAgent?.matched_competencies || []).length;
    const missingCount = (competencyAgent?.missing_competencies || []).length;
    const totalReqs = matchedCount + missingCount;
    if (totalReqs > 0) {
      const expectedCompetencyScore = Math.round((matchedCount / totalReqs) * 100);
      if (Math.abs(expectedCompetencyScore - competencyScore) > 15) {
        biasReasons.push(
          `Competency score (${competencyScore}) differs significantly from matched/missing ratio (${matchedCount}/${totalReqs} = ${expectedCompetencyScore}) — possible scoring error`
        );
      }
    }

    const agentScores = [competencyScore, experienceScore, softSkillsScore].filter(s => s > 0);
    if (agentScores.length >= 2) {
      const maxScore = Math.max(...agentScores);
      const minScore = Math.min(...agentScores);
      if (maxScore - minScore > 60) {
        biasReasons.push(
          `Extreme score variance across agents (${minScore} to ${maxScore}) — review for evaluation consistency`
        );
      }
    }

    if (agentScores.length >= 3 &&
      agentScores.every(s => s === agentScores[0]) &&
      agentScores[0] > 90) {
      biasReasons.push('All agents returned identical high scores — verify evaluation rigor');
    }

    const relevantYears = safeAgentReports?.experience_agent?.relevant_years_validated ?? null;
    if (relevantYears !== null && relevantYears === 0 && experienceScore > 50) {
      biasReasons.push(
        `Experience score (${experienceScore}) contradicts 0 validated relevant years — review experience evaluation`
      );
    }

    const hasJurisdictionIssue = safeAgentReports?.competency_agent?.jurisdiction_issue === true;
    const aggregatorFlaggedJurisdiction = safeSummary?.jurisdiction_flag === true;

    if (hasJurisdictionIssue || aggregatorFlaggedJurisdiction) {
      biasReasons.push('Jurisdiction/licensing issue: candidate may need license transfer');
    }

    const biasCheck = biasReasons.length > 0
      ? `REVIEW REQUIRED: ${biasReasons.join('; ')}`
      : 'No bias detected';

    return {
      name: safeProfile?.candidate_name || 'Anonymous',
      email: safeProfile?.email || '',
      skills: safeProfile?.skills || [],
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