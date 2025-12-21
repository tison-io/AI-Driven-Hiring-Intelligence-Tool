import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';
import { ExtractedCandidateData, ScoringResult, BiasCheckFlag } from './interfaces/ai-response.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async analyzeResume(rawText: string, jobRole: string, jobDescription?: string) {
    try {
      this.logger.log('Starting AI analysis for candidate using /analyze endpoint');
      const startTime = Date.now();

      const formData = new FormData();
      formData.append('raw_text', rawText);
      formData.append('role_name', jobRole);
      if (jobDescription) {
        formData.append('job_description', jobDescription);
      }

      const response = await axios.post(`${this.aiServiceUrl}/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 seconds timeout for combined processing
      });

      const { candidate_profile: extractedData, evaluation: scoringResult } = response.data;

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      if (extractedData.is_valid_resume === false) {
        throw new HttpException(`Invalid resume: ${extractedData.error || 'Unknown'}`, HttpStatus.BAD_REQUEST);
      }
      if (!extractedData.candidate_name && !extractedData.skills?.length) {
        throw new HttpException('Insufficient data extracted from resume: Missing required data', HttpStatus.BAD_REQUEST);
      }

      const breakdown = scoringResult.scoring_breakdown || {};
      this.logger.log('| Time (s)   | Score    | Conf     | Skill    | Experience   | Education    | Certs    |');
      this.logger.log(`| ${processingTime.padStart(10)} | ${String(scoringResult.role_fit_score || 0).padStart(8)} | ${String(scoringResult.confidence_score || 0).padStart(8)} | ${String(breakdown.skill_match || 0).padStart(8)} | ${String(breakdown.experience_relevance || 0).padStart(12)} | ${String(breakdown.education_fit || 0).padStart(12)} | ${String(breakdown.certifications || 0).padStart(8)} |`);

      return this.transformAiResponse(extractedData, scoringResult);

    } catch (error) {
      this.logger.error('AI analysis failed', error.stack);
      if (axios.isAxiosError(error)) {
        this.logger.error(`AI Service Response: ${JSON.stringify(error.response?.data)}`);
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  private transformAiResponse(extractedData: ExtractedCandidateData, scoringResult: ScoringResult) {
    const keyStrengths = scoringResult.key_strengths?.map((s) =>
      typeof s === 'string' ? s : (s.strength || JSON.stringify(s))
    ) || [];

    const potentialWeaknesses = scoringResult.potential_weaknesses?.map((w) =>
      typeof w === 'string' ? w : (w.weakness || JSON.stringify(w))
    ) || [];

    const roleFitScore = scoringResult.role_fit_score || 0;
    const breakdown = scoringResult.scoring_breakdown || {};
    const relevantExperience = breakdown.relevant_years_calculated !== undefined
      ? breakdown.relevant_years_calculated
      : (extractedData.total_years_experience || 0);

    return {
      name: extractedData.candidate_name || 'Anonymous',
      roleFitScore,
      isShortlisted: roleFitScore >= 80,
      keyStrengths,
      potentialWeaknesses,
      missingSkills: scoringResult.missing_skills || [],
      interviewQuestions: scoringResult.recommended_interview_questions || [],
      confidenceScore: scoringResult.confidence_score || 0,
      biasCheck: this.formatBiasCheck(scoringResult.bias_check_flag),
      skills: extractedData.skills || [],
      experienceYears: relevantExperience,
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

  private formatBiasCheck(biasFlag?: BiasCheckFlag): string {
    if (!biasFlag) return 'No bias analysis available';

    if (biasFlag.detected) {
      return `Potential bias detected: ${biasFlag.flags?.join(', ') || 'Unknown bias factors'}`;
    }

    return 'No significant bias detected in evaluation';
  }
}