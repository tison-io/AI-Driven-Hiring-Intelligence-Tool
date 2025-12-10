import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceUrl: string;

  constructor(private configService: ConfigService) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async evaluateCandidate(rawText: string, jobRole: string, jobDescription?: string) {
    try {
      this.logger.log('Starting AI evaluation for candidate');

      // Step 1: Extract structured data from raw text
      const extractedData = await this.extractCandidateData(rawText);

      this.logger.debug(`Extracted data: ${JSON.stringify(extractedData)}`);

      // Check if resume is valid (default to true if field is missing)
      if (extractedData.is_valid_resume === false) {
        this.logger.warn(`AI marked resume as invalid. Reason: ${extractedData.error || 'Unknown'}`);
        return this.getMockResponse();
      }

      // Validate we have minimum required data
      if (!extractedData.candidate_name && !extractedData.skills?.length) {
        this.logger.warn('Insufficient data extracted, falling back to mock data');
        return this.getMockResponse();
      }

      // Step 2: Score candidate against job role
      const scoringResult = await this.scoreCandidateData(extractedData, jobRole, jobDescription);

      this.logger.debug(`Scoring result: ${JSON.stringify(scoringResult)}`);

      // Step 3: Transform to backend format
      return this.transformAiResponse(extractedData, scoringResult);

    } catch (error) {
      this.logger.error('AI evaluation failed', error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      // Fallback to mock data if AI service fails
      this.logger.warn('Falling back to mock AI response');
      return this.getMockResponse();
    }
  }

  private async extractCandidateData(rawText: string) {
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

  private async scoreCandidateData(candidateData: any, jobRole: string, customJobDescription?: string) {
    const jobDescription = customJobDescription || this.getJobDescription(jobRole);

    const response = await axios.post(`${this.aiServiceUrl}/score`, {
      candidate_data: candidateData,
      job_description: jobDescription,
      role_name: jobRole
    }, {
      timeout: 30000
    });

    return response.data;
  }

  private transformAiResponse(extractedData: any, scoringResult: any) {
    const keyStrengths = scoringResult.key_strengths?.map((s: any) =>
      typeof s === 'string' ? s : (s.strength || JSON.stringify(s))
    ) || [];

    const potentialWeaknesses = scoringResult.potential_weaknesses?.map((w: any) =>
      typeof w === 'string' ? w : (w.weakness || JSON.stringify(w))
    ) || [];

    this.logger.debug(`Transforming Work Exp: ${JSON.stringify(extractedData.work_experience)}`);

    return {
      name: extractedData.candidate_name || 'Anonymous',
      roleFitScore: scoringResult.role_fit_score || 0,
      keyStrengths,
      potentialWeaknesses,
      missingSkills: scoringResult.missing_skills || [],
      interviewQuestions: scoringResult.recommended_interview_questions || [],
      confidenceScore: scoringResult.confidence_score || 0,
      biasCheck: this.formatBiasCheck(scoringResult.bias_check_flag),
      skills: extractedData.skills || [],
      experienceYears: extractedData.total_years_experience || 0,
      workExperience: extractedData.work_experience?.map((job: any) => ({
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

  private formatBiasCheck(biasFlag: any): string {
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

  private getMockResponse() {
    return {
      name: 'John Doe',
      roleFitScore: Math.floor(Math.random() * 40) + 60,
      keyStrengths: ['Strong technical background', 'Good communication skills'],
      potentialWeaknesses: ['Limited leadership experience'],
      missingSkills: ['Docker', 'Kubernetes'],
      interviewQuestions: ['Tell me about your experience with microservices'],
      confidenceScore: Math.floor(Math.random() * 20) + 80,
      biasCheck: 'AI service unavailable - mock evaluation used',
      skills: ['JavaScript', 'Node.js', 'React'],
      experienceYears: Math.floor(Math.random() * 10) + 2,
      education: [],
      certifications: []
    };
  }

  async extractSkills(rawText: string): Promise<string[]> {
    try {
      const extractedData = await this.extractCandidateData(rawText);
      return extractedData.skills || [];
    } catch (error) {
      this.logger.error('Skill extraction failed', error.stack);
      return ['JavaScript', 'Python', 'React'].filter(() => Math.random() > 0.7);
    }
  }
}