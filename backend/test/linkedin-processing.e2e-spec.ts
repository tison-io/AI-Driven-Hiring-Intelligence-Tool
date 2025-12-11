import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LinkedIn Profile Processing Integration Test (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable validation pipes (same as main.ts)
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    // Use existing user credentials
    const testEmail = 'test@gmail.com';
    const testPassword = 'Boazmarube@2024';

    console.log('🔐 Logging in with existing user...');

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ 
        email: testEmail, 
        password: testPassword 
      });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body.access_token).toBeDefined();
    
    authToken = loginResponse.body.access_token;
    
    console.log('✓ Test user authenticated');
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Test 1: Valid LinkedIn URL → Profile Scraped → AI Evaluates → Candidate Created', () => {
    let candidateId: string;

    it('should accept valid LinkedIn URL and start processing', async () => {
      const startTime = Date.now();

      // Use a real public LinkedIn profile (Bill Gates as example)
      const linkedinUrl = 'https://www.linkedin.com/in/williamhgates';
      const jobRole = 'Technology Executive';

      console.log('\n📋 Test 1: Valid LinkedIn URL Processing');
      console.log(`   URL: ${linkedinUrl}`);
      console.log(`   Job Role: ${jobRole}`);

      const response = await request(app.getHttpServer())
        .post('/api/candidates/linkedin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          linkedinUrl,
          jobRole,
          jobDescription: 'Looking for an experienced technology executive with leadership skills'
        });

      const uploadTime = Date.now() - startTime;

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('candidateId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('pending');
      expect(response.body.message).toContain('LinkedIn profile processed successfully');

      candidateId = response.body.candidateId;

      console.log(`   ✓ Request accepted: ${uploadTime}ms`);
      console.log(`   ✓ Candidate ID: ${candidateId}`);
      console.log(`   ✓ Status: ${response.body.status}`);
    }, 60000);

    it('should create candidate record in database', async () => {
      expect(candidateId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', candidateId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('linkedinUrl');
      expect(response.body).toHaveProperty('jobRole');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('rawText');

      console.log(`   ✓ Candidate found in database`);
      console.log(`   ✓ Name: ${response.body.name}`);
      console.log(`   ✓ Status: ${response.body.status}`);
    }, 30000);

    it('should process profile and extract data', async () => {
      expect(candidateId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const candidate = response.body;

      // Verify profile data was extracted
      expect(candidate.name).toBeTruthy();
      expect(candidate.name).not.toBe('Extracted from Resume');
      expect(candidate.linkedinUrl).toBeTruthy();
      expect(candidate.rawText).toBeTruthy();
      expect(candidate.rawText.length).toBeGreaterThan(50);

      console.log(`   ✓ Profile data extracted`);
      console.log(`   ✓ Raw text length: ${candidate.rawText.length} characters`);
    }, 30000);

    it('should complete AI evaluation within reasonable time', async () => {
      expect(candidateId).toBeDefined();

      console.log(`   ⏳ Waiting for AI evaluation to complete...`);

      let candidate;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds max
      const pollInterval = 1000; // 1 second

      const startTime = Date.now();

      // Poll until status changes from 'pending'
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const response = await request(app.getHttpServer())
          .get(`/api/candidates/${candidateId}`)
          .set('Authorization', `Bearer ${authToken}`);

        candidate = response.body;
        attempts++;

        console.log(`   ⏱️  Attempt ${attempts}: Status = ${candidate.status}`);

        if (candidate.status === 'completed' || candidate.status === 'failed') {
          break;
        }
      }

      const totalTime = Date.now() - startTime;

      // Assertions
      expect(candidate.status).toBe('completed');
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds

      console.log(`   ✓ AI evaluation completed in ${totalTime}ms`);
      console.log(`   ✓ Final status: ${candidate.status}`);
    }, 120000);

    it('should have AI evaluation results', async () => {
      expect(candidateId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const candidate = response.body;

      // Verify AI evaluation fields
      expect(candidate.roleFitScore).toBeDefined();
      expect(candidate.roleFitScore).toBeGreaterThanOrEqual(0);
      expect(candidate.roleFitScore).toBeLessThanOrEqual(100);
      
      expect(candidate.keyStrengths).toBeDefined();
      expect(Array.isArray(candidate.keyStrengths)).toBe(true);
      
      expect(candidate.potentialWeaknesses).toBeDefined();
      expect(Array.isArray(candidate.potentialWeaknesses)).toBe(true);
      
      expect(candidate.missingSkills).toBeDefined();
      expect(Array.isArray(candidate.missingSkills)).toBe(true);
      
      expect(candidate.interviewQuestions).toBeDefined();
      expect(Array.isArray(candidate.interviewQuestions)).toBe(true);
      
      expect(candidate.confidenceScore).toBeDefined();
      expect(candidate.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(candidate.confidenceScore).toBeLessThanOrEqual(100);
      
      expect(candidate.biasCheck).toBeDefined();

      console.log(`\n   📊 AI Evaluation Results:`);
      console.log(`   ✓ Role Fit Score: ${candidate.roleFitScore}/100`);
      console.log(`   ✓ Confidence Score: ${candidate.confidenceScore}/100`);
      console.log(`   ✓ Key Strengths: ${candidate.keyStrengths.length} items`);
      console.log(`   ✓ Potential Weaknesses: ${candidate.potentialWeaknesses.length} items`);
      console.log(`   ✓ Missing Skills: ${candidate.missingSkills.length} items`);
      console.log(`   ✓ Interview Questions: ${candidate.interviewQuestions.length} items`);
      console.log(`   ✓ Bias Check: ${candidate.biasCheck}`);
    }, 30000);

    it('should have extracted skills and experience', async () => {
      expect(candidateId).toBeDefined();

      const response = await request(app.getHttpServer())
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const candidate = response.body;

      // Verify extracted data
      expect(candidate.skills).toBeDefined();
      expect(Array.isArray(candidate.skills)).toBe(true);
      
      expect(candidate.experienceYears).toBeDefined();
      expect(candidate.experienceYears).toBeGreaterThanOrEqual(0);

      console.log(`   ✓ Skills extracted: ${candidate.skills.length} skills`);
      console.log(`   ✓ Experience: ${candidate.experienceYears} years`);
      
      if (candidate.skills.length > 0) {
        console.log(`   ✓ Sample skills: ${candidate.skills.slice(0, 5).join(', ')}`);
      }
    }, 30000);
  });
});
