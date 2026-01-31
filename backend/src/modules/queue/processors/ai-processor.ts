import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotFoundException, Logger } from '@nestjs/common';
import { CandidatesService } from '../../candidates/candidates.service';
import { AiService } from '../../ai/ai.service';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';

@Processor('ai-processing')
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private candidatesService: CandidatesService,
    private aiService: AiService,
  ) { }

  @Process('process-candidate')
  async handleAIProcessing(job: Job) {
    const { candidateId, jobRole, jobDescription } = job.data;
    const startTime = Date.now();

    try {
      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.PROCESSING
      });

      const candidate = await this.candidatesService.findById(candidateId);
      if (!candidate) throw new NotFoundException('Candidate not found');

      this.logger.log(`Starting Graph Analysis for Candidate ${candidateId}...`);

      const result = await this.aiService.evaluateCandidateGraph(
        candidate.rawText,
        jobRole,
        jobDescription
      );

      const processingTime = Date.now() - startTime;

      await this.candidatesService.update(candidateId, {
        name: result.name,
        skills: result.skills,
        experienceYears: result.experienceYears,
        workExperience: result.workExperience,
        education: result.education,
        certifications: result.certifications,
        
        roleFitScore: result.roleFitScore,
        scoringBreakdown: result.scoringBreakdown,
        isShortlisted: result.isShortlisted,
        keyStrengths: result.keyStrengths,
        potentialWeaknesses: result.potentialWeaknesses,
        missingSkills: result.missingSkills,
        interviewQuestions: result.interviewQuestions,
        confidenceScore: result.confidenceScore,
        biasCheck: result.biasCheck,

        status: ProcessingStatus.COMPLETED,
        processingTime,
      });

      this.logger.log(`Graph Processing Complete for ${candidateId}. Time: ${processingTime}ms`);
      return { success: true, candidateId };

    } catch (error) {
      this.logger.error(`Processing failed for candidate ${candidateId}`, error.stack);
      
      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.FAILED,
        processingTime: Date.now() - startTime,
      });

      throw error;
    }
  }
}