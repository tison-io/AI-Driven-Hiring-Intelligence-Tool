import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('ai-processing')
    private aiProcessingQueue: Queue,
  ) {}

  async addAIProcessingJob(
    candidateId: string,
    jobRole: string,
    jobDescription?: string,
  ) {
    return this.aiProcessingQueue.add(
      'process-candidate',
      {
        candidateId,
        jobRole,
        ...(jobDescription && { jobDescription }),
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  async getJobStatus(jobId: string) {
    const job = await this.aiProcessingQueue.getJob(jobId);
    return job
      ? {
          id: job.id,
          progress: job.progress(),
          status: await job.getState(),
          data: job.data,
        }
      : null;
  }
}
