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
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      this.logger.log(`Stage 1: Calculating Score for Candidate ${candidateId}...`);

      const stage1Result = await this.aiService.evaluateCandidateFast(
        candidate.rawText,
        jobRole,
        jobDescription
      );

      await this.candidatesService.update(candidateId, {
        name: stage1Result.name,
        roleFitScore: stage1Result.roleFitScore,
        scoringBreakdown: stage1Result.scoringBreakdown,
        skills: stage1Result.skills,
        experienceYears: stage1Result.experienceYears,
        workExperience: stage1Result.workExperience,
        education: stage1Result.education,
        certifications: stage1Result.certifications,
        isShortlisted: stage1Result.isShortlisted,
        status: ProcessingStatus.PROCESSING
      });

      this.logger.log(`Stage 1 Saved (Name updated). UI should now see the score.`);

      this.logger.log(`Stage 2: Generating Interview Questions...`);

      const stage2Result = await this.aiService.evaluateCandidateDetailed(
        stage1Result.stage2Payload
      );

      const processingTime = Date.now() - startTime;

      await this.candidatesService.update(candidateId, {
        keyStrengths: stage2Result.keyStrengths,
        potentialWeaknesses: stage2Result.potentialWeaknesses,
        missingSkills: stage2Result.missingSkills,
        interviewQuestions: stage2Result.interviewQuestions,
        confidenceScore: stage2Result.confidenceScore,
        biasCheck: stage2Result.biasCheck,

        status: ProcessingStatus.COMPLETED,
        processingTime,
      });

      this.logger.log(`Stage 2 Saved. Process Complete.`);

      return { success: true, candidateId };

    } catch (error) {
      this.logger.error(`Processing failed for candidate ${candidateId}`, error.stack);
      const processingTime = Date.now() - startTime;

      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.FAILED,
        processingTime,
      });

      throw error;
    }
  }
}