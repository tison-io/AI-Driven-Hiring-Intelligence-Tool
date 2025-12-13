import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotFoundException } from '@nestjs/common';
import { CandidatesService } from '../../candidates/candidates.service';
import { AiService } from '../../ai/ai.service';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';

@Processor('ai-processing')
export class AiProcessor {
  constructor(
    private candidatesService: CandidatesService,
    private aiService: AiService,
  ) {}

  @Process('process-candidate')
  async handleAIProcessing(job: Job) {
    const { candidateId, jobRole, jobDescription } = job.data;
    const startTime = Date.now();

    try {
      // Update status to processing
      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.PROCESSING,
      });

      // Get candidate data
      const candidate = await this.candidatesService.findById(candidateId);
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      // Call AI service (placeholder)
      const aiResults = await this.aiService.evaluateCandidate(
        candidate.rawText,
        jobRole,
        jobDescription,
      );

      const processingTime = Date.now() - startTime;

      // Update candidate with AI results
      await this.candidatesService.update(candidateId, {
        ...aiResults,
        status: ProcessingStatus.COMPLETED,
        processingTime,
      });

      return { success: true, candidateId };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Update status to failed
      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.FAILED,
        processingTime,
      });

      throw error;
    }
  }
}
