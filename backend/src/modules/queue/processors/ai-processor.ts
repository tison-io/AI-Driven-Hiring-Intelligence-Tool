import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CandidatesService } from '../../candidates/candidates.service';
import { AiService } from '../../ai/ai.service';

@Processor('ai-processing')
export class AiProcessor {
  constructor(
    private candidatesService: CandidatesService,
    private aiService: AiService,
  ) {}

  @Process('process-candidate')
  async handleAIProcessing(job: Job) {
    const { candidateId, jobRole } = job.data;

    try {
      // Update status to processing
      await this.candidatesService.update(candidateId, { 
        status: 'processing' as any 
      });

      // Get candidate data
      const candidate = await this.candidatesService.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Call AI service (placeholder)
      const aiResults = await this.aiService.evaluateCandidate(
        candidate.rawText,
        jobRole
      );

      // Update candidate with AI results
      await this.candidatesService.update(candidateId, {
        ...aiResults,
        status: 'completed' as any,
      });

      return { success: true, candidateId };
    } catch (error) {
      // Update status to failed
      await this.candidatesService.update(candidateId, { 
        status: 'failed' as any 
      });
      
      throw error;
    }
  }
}