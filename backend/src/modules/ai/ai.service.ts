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

  async evaluateCandidate(rawText: string, jobRole: string, jobDescription?: string) {
    try {
      this.logger.log('Starting parallel AI evaluation via /analyze');
      const startTime = Date.now();

      // 1. Prepare the Form Data
      const formData = new FormData();
      formData.append('raw_text', rawText); // 'raw_text' matches main.py
      formData.append('role_name', jobRole);
      
      // Use custom JD or fetch default
      const finalJD = jobDescription || this.getJobDescription(jobRole);
      formData.append('job_description', finalJD);

      // 2. Make the Single Call
      const response = await axios.post(
        `${this.aiServiceUrl}/analyze`, 
        formData, 
        {
          headers: {
            ...formData.getHeaders(), // Crucial for form boundaries
          },
          timeout: 60000 // Increased timeout for the combined long operation
        }
      );

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`AI Processing complete in ${processingTime}s`);

      // 3. Unpack and Transform
      // The backend keys 'candidate_profile' and 'evaluation' map to our arguments
      const { candidate_profile, evaluation } = response.data;

      return this.transformAiResponse(candidate_profile, evaluation);

    } catch (error) {
      this.logger.error('AI evaluation failed', error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw error;
    }
  }

  private async extractCandidateData(rawText: string): Promise<ExtractedCandidateData> {
    const response = await axios.post(`${this.aiServiceUrl}/parse-text`, {
      text: rawText
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.data;
  }

  private async scoreCandidateData(candidateData: ExtractedCandidateData, jobRole: string, customJobDescription?: string): Promise<ScoringResult> {
    const jobDescription = customJobDescription || this.getJobDescription(jobRole);

    const response = await axios.post(`${this.aiServiceUrl}/score`, {
      candidate_data: candidateData,
      role_name: jobRole,
      job_description: jobDescription
    }, {
      timeout: 30000
    });

    return response.data;
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

  private getJobDescription(jobRole: string): string {
    // Basic job descriptions - in production, fetch from database
    const jobDescriptions = {
      'Backend Engineer': 'Develop server-side applications using Node.js, Python, or Java. Experience with databases, APIs, and cloud services required.',
      'Frontend Developer': 'Build user interfaces using React, Vue, or Angular. Strong HTML, CSS, JavaScript skills required.',
      'Full Stack Developer': 'Work on both frontend and backend development. Experience with modern web frameworks and databases.',
      'Data Analyst': 'Analyze data using SQL, Python, R. Experience with data visualization tools and statistical analysis.',
      'DevOps Engineer': 'Manage CI/CD pipelines, cloud infrastructure, and deployment automation. Docker, Kubernetes experience preferred.'
    };

    return jobDescriptions[jobRole] || `Professional role requiring relevant technical skills and experience in ${jobRole}.`;
  }

  async extractSkills(rawText: string): Promise<string[]> {
    try {
      const extractedData = await this.extractCandidateData(rawText);
      return extractedData.skills || [];
    } catch (error) {
      this.logger.error('Skill extraction failed', error.stack);
      throw error;
    }
  }
}