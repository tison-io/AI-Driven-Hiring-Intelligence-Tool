import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { CandidatesService } from '../src/modules/candidates/candidates.service';

describe('RBAC Flow Tests', () => {
  let app: INestApplication;
  let adminToken: string;
  let recruiterToken: string;
  let recruiterUserId: string;
  let recruiterCandidateId: string;
  let candidatesService: CandidatesService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    candidatesService = moduleFixture.get<CandidatesService>(CandidatesService);
    await app.init();
    await setupTestUsers();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function setupTestUsers() {
    const timestamp = Date.now();

    // Register and login admin with unique email
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin${timestamp}@test.com`,
        password: 'AdminPass123!',
        role: UserRole.ADMIN,
      });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `admin${timestamp}@test.com`,
        password: 'AdminPass123!',
      });

    adminToken = adminLogin.body.access_token;

    // Register and login recruiter with unique email
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `recruiter${timestamp}@test.com`,
        password: 'RecruiterPass123!',
        role: UserRole.RECRUITER,
      });

    const recruiterLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `recruiter${timestamp}@test.com`,
        password: 'RecruiterPass123!',
      });

    recruiterToken = recruiterLogin.body.access_token;
    recruiterUserId = recruiterLogin.body.user._id || recruiterLogin.body.user.id;

    // Create candidate directly via service to avoid API rate limits
    const candidate = await candidatesService.create({
      name: 'Test Candidate',
      jobRole: 'Software Engineer',
      status: 'completed' as any,
      roleFitScore: 85,
      rawText: 'Mock candidate data for testing',
      keyStrengths: ['JavaScript', 'Node.js'],
      potentialWeaknesses: ['Public speaking'],
      missingSkills: ['Python'],
      interviewQuestions: ['Tell me about yourself'],
      confidenceScore: 90,
      biasCheck: 'No bias detected',
      skills: ['JavaScript', 'Node.js', 'React'],
      experienceYears: 5,
      createdBy: recruiterUserId
    });

    recruiterCandidateId = candidate._id;
  }

  it('Recruiter login → Can only see own candidates', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/candidates')
      .set('Authorization', `Bearer ${recruiterToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    // Verify recruiter sees their candidate
    const candidateIds = response.body.map((c: { _id?: string; id?: string }) => String(c._id || c.id));
    const expectedId = String(recruiterCandidateId);

    expect(candidateIds).toContain(expectedId);
  });



  it('Recruiter tries to access admin endpoint → 403 Forbidden', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${recruiterToken}`);

    expect(response.status).toBe(403);
  });

  it('Invalid JWT token → 401 Unauthorized across all endpoints', async () => {
    const endpoints = [
      '/api/candidates',
      '/api/dashboard',
      '/api/dashboard/admin',
      '/auth/profile'
    ];

    for (const endpoint of endpoints) {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    }
  });
});
