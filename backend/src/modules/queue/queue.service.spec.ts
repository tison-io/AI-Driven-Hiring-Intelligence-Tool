import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { Queue, Job } from 'bull';

describe('QueueService', () => {
  let service: QueueService;
  let mockQueue: jest.Mocked<Queue>;

  const mockJob = {
    id: 'job-123',
    data: { candidateId: 'candidate-123', jobRole: 'Backend Engineer' },
    progress: jest.fn().mockReturnValue(50),
    getState: jest.fn().mockResolvedValue('active'),
  } as unknown as jest.Mocked<Job>;

  beforeEach(async () => {
    const mockQueueInstance = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken('ai-processing'),
          useValue: mockQueueInstance,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    mockQueue = module.get(getQueueToken('ai-processing'));
  });

  describe('addAIProcessingJob', () => {
    it('should add job with correct parameters', async () => {
      const mockJobResult = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJobResult as any);

      const result = await service.addAIProcessingJob(
        'candidate-123',
        'Backend Engineer',
        'Node.js experience required'
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-candidate',
        {
          candidateId: 'candidate-123',
          jobRole: 'Backend Engineer',
          jobDescription: 'Node.js experience required',
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      expect(result).toBe(mockJobResult);
    });

    it('should add job without job description', async () => {
      const mockJobResult = { id: 'job-456' };
      mockQueue.add.mockResolvedValue(mockJobResult as any);

      await service.addAIProcessingJob('candidate-456', 'Frontend Engineer');

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-candidate',
        {
          candidateId: 'candidate-456',
          jobRole: 'Frontend Engineer',
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );
    });

    it('should handle queue add failures', async () => {
      mockQueue.add.mockRejectedValue(new Error('Queue connection failed'));

      await expect(
        service.addAIProcessingJob('candidate-123', 'Backend Engineer')
      ).rejects.toThrow('Queue connection failed');
    });
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      mockQueue.getJob.mockResolvedValue(mockJob);

      const result = await service.getJobStatus('job-123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
      expect(result).toEqual({
        id: 'job-123',
        progress: 50,
        status: 'active',
        data: { candidateId: 'candidate-123', jobRole: 'Backend Engineer' },
      });
    });

    it('should return null when job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const result = await service.getJobStatus('non-existent-job');

      expect(mockQueue.getJob).toHaveBeenCalledWith('non-existent-job');
      expect(result).toBeNull();
    });

    it('should handle job retrieval errors', async () => {
      mockQueue.getJob.mockRejectedValue(new Error('Redis connection failed'));

      await expect(service.getJobStatus('job-123')).rejects.toThrow(
        'Redis connection failed'
      );
    });
  });

  describe('Queue Configuration', () => {
    it('should configure retry attempts correctly', async () => {
      await service.addAIProcessingJob('candidate-123', 'Backend Engineer');

      const callArgs = mockQueue.add.mock.calls[0];
      const options = callArgs[2];

      expect(options.attempts).toBe(3);
      expect(options.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
    });
  });
});