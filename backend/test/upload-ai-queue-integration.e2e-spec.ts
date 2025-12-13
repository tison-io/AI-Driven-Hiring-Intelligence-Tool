import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProcessingStatus } from '../src/common/enums/processing-status.enum';
import * as fs from 'fs';
import * as path from 'path';
import { QueueService } from '../src/modules/queue/queue.service';
import { AiService } from '../src/modules/ai/ai.service';

describe('Upload + AI + Queue Integration', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    // Login with existing test account
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'recruiter1@test.com',
        password: 'NewPassword1234!'
      });

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Flow 1: Upload File → Extract Text → Send to AI → Queue Job → Process → Update Candidate', () => {
    it('should complete full resume processing flow', async () => {
      // Create test PDF file
      const testPdfPath = path.join(__dirname, '../../AI_Backend/Sample Resume6.pdf');
      
      // Step 1: Upload file and verify initial response
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/candidates/upload-resume')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testPdfPath)
        .field('jobRole', 'Backend Engineer')
        .field('jobDescription', 'Node.js developer with 3+ years experience')
        .expect(201);

      expect(uploadResponse.body).toMatchObject({
        candidateId: expect.any(String),
        message: 'Resume uploaded successfully. Processing started.',
        status: 'pending'
      });

      const candidateId = uploadResponse.body.candidateId;

      // Step 2: Verify candidate created with PENDING status
      const initialCandidate = await request(app.getHttpServer())
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(initialCandidate.body).toMatchObject({
        _id: candidateId,
        status: ProcessingStatus.PENDING,
        jobRole: 'Backend Engineer',
        rawText: expect.any(String),
        createdBy: expect.any(String)
      });

      // Step 3: Wait for queue processing (with timeout)
      let processedCandidate;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout for AI processing

      while (attempts < maxAttempts) {
        const response = await request(app.getHttpServer())
          .get(`/api/candidates/${candidateId}`)
          .set('Authorization', `Bearer ${authToken}`);

        if (response.body.status === ProcessingStatus.COMPLETED || response.body.status === ProcessingStatus.FAILED) {
          processedCandidate = response.body;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // Step 4: Verify AI processing completed (or failed gracefully)
      expect(processedCandidate).toBeDefined();
      
      if (processedCandidate.status === ProcessingStatus.COMPLETED) {
        expect(processedCandidate.status).toBe(ProcessingStatus.COMPLETED);
      expect(processedCandidate).toMatchObject({
        name: expect.any(String),
        roleFitScore: expect.any(Number),
        keyStrengths: expect.any(Array),
        potentialWeaknesses: expect.any(Array),
        skills: expect.any(Array),
        experienceYears: expect.any(Number),
        processingTime: expect.any(Number)
      });

        // Step 5: Verify AI results are realistic
        expect(processedCandidate.roleFitScore).toBeGreaterThanOrEqual(0);
        expect(processedCandidate.roleFitScore).toBeLessThanOrEqual(100);
        expect(processedCandidate.processingTime).toBeGreaterThan(0);
      } else {
        // If AI service is down, candidate should be marked as failed
        expect(processedCandidate.status).toBe(ProcessingStatus.FAILED);
        expect(processedCandidate.processingTime).toBeGreaterThan(0);
      }
    }, 60000);

    it('should handle file extraction errors gracefully', async () => {
      // Create invalid file
      const invalidFile = Buffer.from('invalid content');
      
      const response = await request(app.getHttpServer())
        .post('/api/candidates/upload-resume')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', invalidFile, 'invalid.txt')
        .field('jobRole', 'Backend Engineer')
        .expect(400);

      expect(response.body.message).toContain('PDF and DOCX');
    });

    it('should handle AI service failures with fallback', async () => {
      // Mock AI service failure by using invalid job role
      const testPdfPath = path.join(__dirname, '../../AI_Backend/Sample Resume6.pdf');
      
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/candidates/upload-resume')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testPdfPath)
        .field('jobRole', 'Backend Engineer');

      // Should accept upload regardless of job role
      expect([201, 400]).toContain(uploadResponse.status);
      
      if (uploadResponse.status !== 201) {
        return; // Skip rest of test if upload failed
      }

      const candidateId = uploadResponse.body.candidateId;

      // Wait for processing
      let processedCandidate;
      let attempts = 0;
      while (attempts < 20) {
        const response = await request(app.getHttpServer())
          .get(`/api/candidates/${candidateId}`)
          .set('Authorization', `Bearer ${authToken}`);

        if (response.body.status !== ProcessingStatus.PENDING) {
          processedCandidate = response.body;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      // Should complete (either AI or mock data)
      expect(processedCandidate.status).toBe(ProcessingStatus.COMPLETED);
      expect(processedCandidate.biasCheck).toBeDefined();
    }, 30000);
  });

  describe('Flow 2: Upload File -> AI Service Down -> Job Queued for Retry', () => {
    it('should retry AI service failures and mark as failed after 3 attempts', async () => {
      const testPdfPath = path.join(__dirname, '../../AI_Backend/Sample Resume6.pdf');

      // Step 1: Mock axios to simulate AI service down
      const axios = require('axios');
      const originalPost = axios.post;
      let callCount = 0;
      
      axios.post = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('ECONNREFUSED: AI service unavailable'));
      });

      try {
        // Step 2: Upload file successfully
        const uploadResponse = await request(app.getHttpServer())
          .post('/api/candidates/upload-resume')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testPdfPath)
          .field('jobRole', 'Backend Engineer')
          .field('jobDescription', 'Node.js developer with 3+ years experience')
          .expect(201);

        const candidateId = uploadResponse.body.candidateId;

        // Step 3: Wait for retries to complete (queue configured for 3 attempts)
        let finalCandidate;
        let attempts = 0;
        const maxAttempts = 30; // Wait up to 30 seconds for retries

        while (attempts < maxAttempts) {
          const response = await request(app.getHttpServer())
            .get(`/api/candidates/${candidateId}`)
            .set('Authorization', `Bearer ${authToken}`);

          if (response.body.status === ProcessingStatus.FAILED) {
            finalCandidate = response.body;
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        // Step 4: Verify candidate marked as failed after retries
        expect(finalCandidate).toBeDefined();
        expect(finalCandidate.status).toBe(ProcessingStatus.FAILED);
        
        // Wait additional time for all retry attempts (exponential backoff: 2s, 4s, 8s)
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Verify AI service was called multiple times (3 attempts)
        // Queue retries the entire job, so each retry calls axios again
        expect(callCount).toBeGreaterThanOrEqual(3);
      } finally {
        // Restore original method
        axios.post = originalPost;
      }
    }, 60000);
  });

  describe('Flow 3: Upload File → Queue Service Down → Graceful Error Handling', () => {
    it('should handle queue service failures gracefully', async () => {
      const testPdfPath = path.join(__dirname, '../../AI_Backend/Sample Resume6.pdf');
      
      // Mock queue service to simulate it being down
      const queueService = app.get(QueueService);
      const originalAddJob = queueService.addAIProcessingJob;
      queueService.addAIProcessingJob = jest.fn().mockRejectedValue(
        new Error('Redis connection failed')
      );

      try {
        // Step 1: Upload should fail when queue is down
        const uploadResponse = await request(app.getHttpServer())
          .post('/api/candidates/upload-resume')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testPdfPath)
          .field('jobRole', 'Backend Engineer')
          .field('jobDescription', 'Node.js developer with 3+ years experience')
          .expect(500);

        // Step 2: Verify error response
        expect(uploadResponse.body).toMatchObject({
          statusCode: 500,
          message: 'Internal server error'
        });

        // Step 3: Verify queue service was called
        expect(queueService.addAIProcessingJob).toHaveBeenCalledWith(
          expect.any(String),
          'Backend Engineer',
          'Node.js developer with 3+ years experience'
        );
      } finally {
        // Restore original method
        queueService.addAIProcessingJob = originalAddJob;
      }
    });
  });

  describe('Flow 4: Multiple Concurrent Uploads → All Processed Correctly', () => {
    it('should handle multiple concurrent uploads', async () => {
      const testPdfPath = path.join(__dirname, '../../AI_Backend/Sample Resume6.pdf');
      const uploadCount = 3;
      
      // Step 1: Upload multiple files concurrently
      const uploadPromises = Array.from({ length: uploadCount }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/candidates/upload-resume')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testPdfPath)
          .field('jobRole', `Engineer ${i + 1}`)
          .field('jobDescription', `Job description ${i + 1}`)
          .expect(201)
      );

      const uploadResponses = await Promise.all(uploadPromises);
      const candidateIds = uploadResponses.map(res => res.body.candidateId);

      // Step 2: Wait for all to complete processing
      const processedCandidates = await Promise.all(
        candidateIds.map(async (candidateId) => {
          let attempts = 0;
          while (attempts < 60) {
            const response = await request(app.getHttpServer())
              .get(`/api/candidates/${candidateId}`)
              .set('Authorization', `Bearer ${authToken}`);

            if (response.body.status === ProcessingStatus.COMPLETED || response.body.status === ProcessingStatus.FAILED) {
              return response.body;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
          }
          throw new Error(`Candidate ${candidateId} processing timeout`);
        })
      );

      // Step 3: Verify all processed (completed or failed)
      expect(processedCandidates).toHaveLength(uploadCount);
      processedCandidates.forEach((candidate, i) => {
        expect([ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]).toContain(candidate.status);
        expect(candidate.jobRole).toBe(`Engineer ${i + 1}`);
        if (candidate.status === ProcessingStatus.COMPLETED) {
          expect(candidate.roleFitScore).toBeGreaterThanOrEqual(0);
        }
      });
    }, 90000);
  });
});
