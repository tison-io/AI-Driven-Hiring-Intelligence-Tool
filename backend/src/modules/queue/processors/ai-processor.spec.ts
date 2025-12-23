import { Test, TestingModule } from '@nestjs/testing';
import { AiProcessor } from './ai-processor';
import { CandidatesService } from '../../candidates/candidates.service';
import { AiService } from '../../ai/ai.service';
import { Job } from 'bull';

describe('AiProcessor', () => {
  let processor: AiProcessor;
  let candidatesService: jest.Mocked<CandidatesService>;
  let aiService: jest.Mocked<AiService>;

  const mockCandidate = {
    _id: 'candidate-123',
    name: 'John Doe',
    rawText: 'John Doe\nSoftware Engineer\n5 years experience...',
    jobRole: 'Backend Engineer',
    status: 'pending',
  };

  const mockAiResults = {
    name: 'John Doe',
    roleFitScore: 85,
    isShortlisted: true,
    keyStrengths: ['JavaScript', 'Node.js', 'MongoDB'],
    potentialWeaknesses: ['Limited cloud experience'],
    missingSkills: ['Docker', 'Kubernetes'],
    interviewQuestions: ['Explain async/await in JavaScript'],
    confidenceScore: 0.92,
    biasCheck: 'No significant bias detected in evaluation',
    skills: ['JavaScript', 'Node.js', 'MongoDB', 'Express'],
    experienceYears: 5,
    workExperience: [],
    education: [],
    certifications: [],
    scoringBreakdown: {
      skill_match: 85,
      experience_relevance: 90,
      education_fit: 80,
      certifications: 75
    }
  };

  const createMockJob = (data: any): jest.Mocked<Job> => ({
    data,
    id: 'job-123',
    progress: jest.fn(),
    moveToCompleted: jest.fn(),
    moveToFailed: jest.fn(),
  } as any);

  beforeEach(async () => {
    const mockCandidatesService = {
      update: jest.fn(),
      findById: jest.fn(),
    };

    const mockAiService = {
      evaluateCandidate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProcessor,
        {
          provide: CandidatesService,
          useValue: mockCandidatesService,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    processor = module.get<AiProcessor>(AiProcessor);
    candidatesService = module.get(CandidatesService);
    aiService = module.get(AiService);
  });

  describe('handleAIProcessing', () => {
    const jobData = {
      candidateId: 'candidate-123',
      jobRole: 'Backend Engineer',
      jobDescription: 'Node.js experience required',
    };

    beforeEach(() => {
      candidatesService.findById.mockResolvedValue(mockCandidate as any);
      candidatesService.update.mockResolvedValue(undefined);
      aiService.evaluateCandidate.mockResolvedValue(mockAiResults);
    });

    it('should process candidate successfully', async () => {
      const job = createMockJob(jobData);

      const result = await processor.handleAIProcessing(job);

      // Verify status update to processing
      expect(candidatesService.update).toHaveBeenCalledWith('candidate-123', {
        status: 'processing',
      });

      // Verify candidate retrieval
      expect(candidatesService.findById).toHaveBeenCalledWith('candidate-123');

      // Verify AI service call
      expect(aiService.evaluateCandidate).toHaveBeenCalledWith(
        mockCandidate.rawText,
        'Backend Engineer',
        'Node.js experience required'
      );

      // Verify final update with AI results
      expect(candidatesService.update).toHaveBeenCalledWith('candidate-123', {
        ...mockAiResults,
        status: 'completed',
        processingTime: expect.any(Number),
      });

      expect(result).toEqual({ success: true, candidateId: 'candidate-123' });
    });

    it('should process candidate without job description', async () => {
      const jobWithoutDescription = {
        candidateId: 'candidate-123',
        jobRole: 'Backend Engineer',
      };
      const job = createMockJob(jobWithoutDescription);

      await processor.handleAIProcessing(job);

      expect(aiService.evaluateCandidate).toHaveBeenCalledWith(
        mockCandidate.rawText,
        'Backend Engineer',
        undefined
      );
    });

    it('should handle candidate not found', async () => {
      candidatesService.findById.mockResolvedValue(null);
      const job = createMockJob(jobData);

      await expect(processor.handleAIProcessing(job)).rejects.toThrow(
        'Candidate not found'
      );

      expect(candidatesService.update).toHaveBeenCalledWith('candidate-123', {
        status: 'failed',
        processingTime: expect.any(Number),
      });
    });

    it('should handle AI service failures', async () => {
      aiService.evaluateCandidate.mockRejectedValue(
        new Error('AI service unavailable')
      );
      const job = createMockJob(jobData);

      await expect(processor.handleAIProcessing(job)).rejects.toThrow(
        'AI service unavailable'
      );

      expect(candidatesService.update).toHaveBeenCalledWith('candidate-123', {
        status: 'failed',
        processingTime: expect.any(Number),
      });
    });

    it('should handle database update failures', async () => {
      candidatesService.update.mockRejectedValueOnce(
        new Error('Database connection failed')
      );
      const job = createMockJob(jobData);

      await expect(processor.handleAIProcessing(job)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should track processing time correctly', async () => {
      const job = createMockJob(jobData);
      const startTime = Date.now();

      await processor.handleAIProcessing(job);

      const updateCalls = candidatesService.update.mock.calls;
      const finalUpdateCall = updateCalls[updateCalls.length - 1];
      const processingTime = finalUpdateCall[1].processingTime;

      expect(processingTime).toBeGreaterThanOrEqual(0);
      expect(processingTime).toBeLessThan(1000); // Should be very fast in tests
    });
  });

  describe('Status Management', () => {
    it('should update status to processing at start', async () => {
      const job = createMockJob({
        candidateId: 'candidate-123',
        jobRole: 'Backend Engineer',
      });

      candidatesService.findById.mockResolvedValue(mockCandidate as any);
      aiService.evaluateCandidate.mockResolvedValue(mockAiResults);

      await processor.handleAIProcessing(job);

      const firstUpdateCall = candidatesService.update.mock.calls[0];
      expect(firstUpdateCall).toEqual(['candidate-123', { status: 'processing' }]);
    });

    it('should update status to completed on success', async () => {
      const job = createMockJob({
        candidateId: 'candidate-123',
        jobRole: 'Backend Engineer',
      });

      candidatesService.findById.mockResolvedValue(mockCandidate as any);
      aiService.evaluateCandidate.mockResolvedValue(mockAiResults);

      await processor.handleAIProcessing(job);

      const finalUpdateCall = candidatesService.update.mock.calls[1];
      expect(finalUpdateCall[1]).toMatchObject({
        status: 'completed',
        ...mockAiResults,
      });
    });

    it('should update status to failed on error', async () => {
      const job = createMockJob({
        candidateId: 'candidate-123',
        jobRole: 'Backend Engineer',
      });

      candidatesService.findById.mockResolvedValue(mockCandidate as any);
      aiService.evaluateCandidate.mockRejectedValue(new Error('AI failed'));

      try {
        await processor.handleAIProcessing(job);
      } catch (error) {
        // Expected to throw
      }

      const failedUpdateCall = candidatesService.update.mock.calls.find(call =>
        call[1].status === 'failed'
      );
      expect(failedUpdateCall).toBeDefined();
      expect(failedUpdateCall[1]).toMatchObject({
        status: 'failed',
        processingTime: expect.any(Number),
      });
    });
  });

  describe('Data Processing', () => {
    it('should process resume candidate data', async () => {
      const resumeCandidate = {
        ...mockCandidate,
        rawText: 'John Doe\nSoftware Engineer\nExperience with React, Node.js...',
      };

      candidatesService.findById.mockResolvedValue(resumeCandidate as any);
      aiService.evaluateCandidate.mockResolvedValue(mockAiResults);

      const job = createMockJob({
        candidateId: 'candidate-123',
        jobRole: 'Frontend Engineer',
      });

      await processor.handleAIProcessing(job);

      expect(aiService.evaluateCandidate).toHaveBeenCalledWith(
        resumeCandidate.rawText,
        'Frontend Engineer',
        undefined
      );
    });

    it('should process LinkedIn candidate data', async () => {
      const linkedinCandidate = {
        ...mockCandidate,
        rawText: 'Name: Jane Smith\nHeadline: Full Stack Developer\nExperience:\n- Senior Developer at Tech Corp...',
      };

      candidatesService.findById.mockResolvedValue(linkedinCandidate as any);
      aiService.evaluateCandidate.mockResolvedValue(mockAiResults);

      const job = createMockJob({
        candidateId: 'candidate-456',
        jobRole: 'Full Stack Engineer',
        jobDescription: 'React and Node.js required',
      });

      await processor.handleAIProcessing(job);

      expect(aiService.evaluateCandidate).toHaveBeenCalledWith(
        linkedinCandidate.rawText,
        'Full Stack Engineer',
        'React and Node.js required'
      );
    });
  });
});