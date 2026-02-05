import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationEventService } from '../notifications/notification-event.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('ai-processing')
    private aiProcessingQueue: Queue,
    private notificationEventService: NotificationEventService,
  ) {}

  async addAIProcessingJob(candidateId: string, jobRole: string, jobDescription?: string, userId?: string) {
    return this.aiProcessingQueue.add('process-candidate', {
      candidateId,
      jobRole,
      userId,
      ...(jobDescription && { jobDescription }),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async addBulkAIProcessingJobs(candidates: Array<{candidateId: string, jobRole: string, jobDescription?: string}>, userId: string) {
    const startTime = Date.now();
    const jobs = [];
    const failedCandidates = [];

    try {
      for (const candidate of candidates) {
        try {
          const job = await this.addAIProcessingJob(
            candidate.candidateId,
            candidate.jobRole,
            candidate.jobDescription,
            userId
          );
          jobs.push(job);
        } catch (error) {
          this.logger.error(`Failed to queue candidate ${candidate.candidateId}`, error);
          failedCandidates.push(candidate.candidateId);
        }
      }

      // Wait for all jobs to complete
      const results = await Promise.allSettled(
        jobs.map(job => job.finished())
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const totalFailedCount = failedCandidates.length + results.filter(result => result.status === 'rejected').length;
      const processingTime = Date.now() - startTime;

      // Emit bulk processing complete event
      this.notificationEventService.emitBulkProcessingComplete({
        userId,
        totalCandidates: candidates.length,
        successCount,
        failedCount: totalFailedCount,
        processingTime,
        failedCandidates: failedCandidates.length > 0 ? failedCandidates : undefined,
      });

      return {
        totalCandidates: candidates.length,
        successCount,
        failedCount: totalFailedCount,
        processingTime,
      };

    } catch (error) {
      this.logger.error('Bulk processing failed', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string) {
    const job = await this.aiProcessingQueue.getJob(jobId);
    return job ? {
      id: job.id,
      progress: job.progress(),
      status: await job.getState(),
      data: job.data,
    } : null;
  }
}