import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Resume Processing Time (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const testEmail = `test${Date.now()}@test.com`;
    const testPassword = 'TestPass123!';

    // Register user
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: testEmail, password: testPassword, role: 'admin' });

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    authToken = loginResponse.body.access_token;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should measure time from upload to completed evaluation', async () => {
    const startTime = Date.now();

    // Upload resume
    const resumePath = path.join(__dirname, '../../AI_Backend/Sample Resume6.pdf');
    const resumeBuffer = fs.readFileSync(resumePath);
    
    const uploadResponse = await request(app.getHttpServer())
      .post('/api/candidates/upload-resume')
      .set('Authorization', `Bearer ${authToken}`)
      .field('jobRole', 'Backend Engineer')
      .attach('file', resumeBuffer, 'resume.pdf');

    if (uploadResponse.status !== 201) {
      console.error('Upload failed:', uploadResponse.status, uploadResponse.body);
    }

    expect(uploadResponse.status).toBe(201);
    const candidateId = uploadResponse.body.candidateId;
    const uploadTime = Date.now() - startTime;

    console.log(`✓ Upload: ${uploadTime}ms | ID: ${candidateId}`);

    // Poll until completed
    let candidate;
    let attempts = 0;
    const maxAttempts = 60;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await request(app.getHttpServer())
        .get(`/api/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${authToken}`);

      candidate = response.body;
      attempts++;

      if (candidate.status === 'completed' || candidate.status === 'failed') break;
    }

    const totalTime = Date.now() - startTime;

    expect(candidate.status).toBe('completed');
    expect(candidate.roleFitScore).toBeDefined();

    console.log(`\n📊 Results:`);
    console.log(`  Upload: ${uploadTime}ms`);
    console.log(`  Total: ${totalTime}ms`);
    console.log(`  AI Processing: ${totalTime - uploadTime}ms`);
    console.log(`  Score: ${candidate.roleFitScore}`);
  }, 120000);
});
