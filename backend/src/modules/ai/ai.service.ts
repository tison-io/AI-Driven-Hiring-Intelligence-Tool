import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { ExtractedCandidateData, ScoringResult, BiasCheckFlag } from './interfaces/ai-response.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async evaluateCandidateFast(rawText: string, jobRole: string, jobDescription?: string) {
    try {
      this.logger.log('Starting Stage 1: Fast Analysis via /analyze/fast');
      const startTime = Date.now();

      const formData = new FormData();
      formData.append('raw_text', rawText);
      formData.append('role_name', jobRole);
      const finalJD = jobDescription || this.getJobDescription(jobRole);
      formData.append('job_description', finalJD);

      const response = await axios.post(
        `${this.aiServiceUrl}/analyze/fast`,
        formData,
        {
          headers: { ...formData.getHeaders() },
          timeout: 30000
        }
      );

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`Stage 1 complete in ${processingTime}s`);

      const { role_fit_score, scoring_breakdown, payload_for_stage_2 } = response.data;

      // Extract candidate data from the payload to show the profile immediately
      const candidateData = payload_for_stage_2?.stage_1_result?.candidate_data;

      if (!candidateData) {
        this.logger.warn('Candidate data not found in Stage 1 payload. Some profile details may be missing.');
      }

      // Transform partial result for Frontend (Score + Profile)
      const frontendData = this.transformStage1Response(candidateData || {}, role_fit_score, scoring_breakdown);

      return {
        ...frontendData,
        stage2Payload: payload_for_stage_2 // Frontend must send this back for Stage 2
      };

    } catch (error) {
      this.handleError(error, 'Stage 1 (Fast) evaluation failed');
    }
  }

  async evaluateCandidateDetailed(stage2Payload: any) {
    try {
      this.logger.log('Starting Stage 2: Detailed Analysis via /analyze/detailed');
      const startTime = Date.now();

      const response = await axios.post(
        `${this.aiServiceUrl}/analyze/detailed`,
        stage2Payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`Stage 2 complete in ${processingTime}s`);

      return this.transformStage2Response(response.data);

    } catch (error) {
      this.handleError(error, 'Stage 2 (Detailed) evaluation failed');
    }
  }

  async evaluateCandidate(rawText: string, jobRole: string, jobDescription?: string) {
    try {
      this.logger.log('Starting Legacy Monolithic Evaluation via /analyze');
      const formData = new FormData();
      formData.append('raw_text', rawText);
      formData.append('role_name', jobRole);
      formData.append('job_description', jobDescription || this.getJobDescription(jobRole));

      const response = await axios.post(`${this.aiServiceUrl}/analyze`, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 60000
      });

      const { candidate_profile, evaluation } = response.data;
      return this.transformAiResponse(candidate_profile, evaluation);

    } catch (error) {
      this.handleError(error, 'Legacy AI evaluation failed');
    }
  }

  private transformStage1Response(extractedData: ExtractedCandidateData, score: number, breakdown: any) {
    const relevantExperience = breakdown.relevant_years_calculated !== undefined
      ? breakdown.relevant_years_calculated
      : (extractedData.total_years_experience || 0);

    return {
      name: extractedData.candidate_name || 'Anonymous',
      roleFitScore: score,
      isShortlisted: score >= 80,
      skills: extractedData.skills || [],
      experienceYears: relevantExperience,
      scoringBreakdown: breakdown,
      workExperience: extractedData.work_experience?.map((job) => ({
        company: job.company || '',
        jobTitle: job.job_title || job.jobTitle || '',
        startDate: job.start_date || job.startDate || '',
        endDate: job.end_date || job.endDate || '',
        description: job.description || '',
        technologies: job.technologies_used || job.technologies || []
      })) || [],
      education: extractedData.education || [],
      certifications: extractedData.certifications || []
    };
  }

  private transformStage2Response(scoringResult: ScoringResult) {
    const keyStrengths = scoringResult.key_strengths?.map((s) =>
      typeof s === 'string' ? s : (s.strength || JSON.stringify(s))
    ) || [];

    const potentialWeaknesses = scoringResult.potential_weaknesses?.map((w) =>
      typeof w === 'string' ? w : (w.weakness || JSON.stringify(w))
    ) || [];

    return {
      keyStrengths,
      potentialWeaknesses,
      missingSkills: scoringResult.missing_skills || [],
      interviewQuestions: scoringResult.recommended_interview_questions || [],
      confidenceScore: scoringResult.confidence_score || 0,
      biasCheck: this.formatBiasCheck(scoringResult.bias_check_flag),
    };
  }

  private transformAiResponse(extractedData: ExtractedCandidateData, scoringResult: ScoringResult) {
    const stage1 = this.transformStage1Response(extractedData, scoringResult.role_fit_score, scoringResult.scoring_breakdown);
    const stage2 = this.transformStage2Response(scoringResult);
    return { ...stage1, ...stage2 };
  }

  private formatBiasCheck(biasFlag?: BiasCheckFlag): string {
    if (!biasFlag) return 'No bias analysis available';
    if (biasFlag.detected) {
      return `Potential bias detected: ${biasFlag.flags?.join(', ') || 'Unknown bias factors'}`;
    }
    return 'No significant bias detected in evaluation';
  }

  private getJobDescription(jobRole: string): string {
    const jobDescriptions = {
      'Backend Engineer': 'Develop server-side applications using Node.js, Python, or Java. Experience with databases, APIs, and cloud services required.',
      'Frontend Developer': 'Build user interfaces using React, Vue, or Angular. Strong HTML, CSS, JavaScript skills required.',
      'Full Stack Developer': 'Work on both frontend and backend development. Experience with modern web frameworks and databases.',
      'Data Analyst': 'Analyze data using SQL, Python, R. Experience with data visualization tools and statistical analysis.',
      'DevOps Engineer': 'Manage CI/CD pipelines, cloud infrastructure, and deployment automation. Docker, Kubernetes experience preferred.'
    };
    return jobDescriptions[jobRole] || `Professional role requiring relevant technical skills and experience in ${jobRole}.`;
  }

  private handleError(error: any, context: string) {
    this.logger.error(context, error.stack);
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(error.message || 'Internal AI Service Error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}