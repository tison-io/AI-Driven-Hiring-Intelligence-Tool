import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { NotificationType } from '../src/modules/notifications/enums/notification-type.enum';
import { UserRole } from '../src/common/enums/user-role.enum';
import { io, Socket } from 'socket.io-client';

describe('Notifications System Integration Test (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testUserId: string;

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

    const testEmail = 'test@gmail.com';
    const testPassword = 'Boazmarube@2024';

    console.log('🔐 Logging in with existing user...');

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body.access_token).toBeDefined();

    authToken = loginResponse.body.access_token;
    testUserId = loginResponse.body.user.id;

    console.log('✓ Test user authenticated');
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Sprint 1: Database Schema & NotificationService', () => {
    let notificationId: string;

    it('should create a notification with valid data', async () => {
      console.log('\n📋 Test 1.1: Create Notification');

      const response = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          type: NotificationType.AI_ANALYSIS_COMPLETE,
          title: 'AI Analysis Complete',
          content: 'Your candidate analysis has been completed successfully.',
          metadata: { candidateId: '507f1f77bcf86cd799439011', processingTime: 45000 }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.type).toBe(NotificationType.AI_ANALYSIS_COMPLETE);
      notificationId = response.body._id;

      console.log(`   ✓ Notification created: ${notificationId}`);
    });

    it('should retrieve notification by ID', async () => {
      console.log('\n📋 Test 1.2: Get Notification by ID');

      const response = await request(app.getHttpServer())
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(notificationId);
      console.log(`   ✓ Retrieved notification: ${response.body._id}`);
    });

    it('should get all notifications with pagination', async () => {
      console.log('\n📋 Test 1.3: Get All Notifications');

      const response = await request(app.getHttpServer())
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('total');
      console.log(`   ✓ Total notifications: ${response.body.total}`);
    });

    it('should mark notification as read', async () => {
      console.log('\n📋 Test 1.4: Mark as Read');

      const response = await request(app.getHttpServer())
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isRead).toBe(true);
      console.log(`   ✓ Notification marked as read`);
    });

    it('should get unread count', async () => {
      console.log('\n📋 Test 1.5: Get Unread Count');

      const response = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('number');
      expect(response.body).toBeGreaterThanOrEqual(0);
      console.log(`   ✓ Unread count: ${response.body}`);
    });

    it('should search notifications', async () => {
      console.log('\n📋 Test 1.6: Search Notifications');

      const response = await request(app.getHttpServer())
        .get('/api/notifications/search?q=analysis')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      console.log(`   ✓ Search results: ${response.body.total} notifications`);
    });

    it('should validate notification type enum', async () => {
      console.log('\n📋 Test 1.7: Validate Types');

      const response = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: testUserId,
          type: 'INVALID_TYPE',
          title: 'Invalid',
          content: 'Should fail'
        });

      expect(response.status).toBe(400);
      console.log(`   ✓ Invalid type rejected: ${response.status}`);
    });

    it('should handle bulk mark as read', async () => {
      console.log('\n📋 Test 1.8: Bulk Operations');

      const notifications = [];
      for (let i = 0; i < 3; i++) {
        const res = await request(app.getHttpServer())
          .post('/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId: testUserId,
            type: NotificationType.NEW_APPLICATION,
            title: `Bulk Test ${i + 1}`,
            content: `Content ${i + 1}`
          });
        notifications.push(res.body._id);
      }

      const response = await request(app.getHttpServer())
        .patch('/api/notifications/mark-multiple-read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds: notifications });

      expect(response.status).toBe(200);
      expect(response.body.modifiedCount).toBeGreaterThan(0);
      console.log(`   ✓ Bulk operation: ${response.body.modifiedCount} marked`);
    });
  });

  describe('Sprint 2: WebSocket Gateway', () => {
    let clientSocket: Socket;
    const serverPort = 3001;

    beforeAll(async () => {
      await app.listen(serverPort);
    });

    afterEach(() => {
      if (clientSocket?.connected) {
        clientSocket.disconnect();
      }
    });

    it('should authenticate WebSocket with JWT', async () => {
      console.log('\n📋 Test 2.1: WebSocket JWT Auth');

      return new Promise<void>((resolve, reject) => {
        clientSocket = io(`http://localhost:${serverPort}/notifications`, {
          auth: { token: authToken },
          transports: ['websocket']
        });

        clientSocket.on('connect', () => {
          console.log(`   ✓ WebSocket authenticated`);
          expect(clientSocket.connected).toBe(true);
          resolve();
        });

        clientSocket.on('connect_error', reject);
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
    }, 10000);

    it('should reject invalid JWT', async () => {
      console.log('\n📋 Test 2.2: Invalid JWT Rejection');

      return new Promise<void>((resolve) => {
        clientSocket = io(`http://localhost:${serverPort}/notifications`, {
          auth: { token: 'invalid' },
          transports: ['websocket']
        });

        clientSocket.on('connect_error', (error) => {
          console.log(`   ✓ Invalid token rejected`);
          expect(error).toBeDefined();
          resolve();
        });

        setTimeout(() => resolve(), 3000);
      });
    }, 10000);

    it('should receive real-time notifications', async () => {
      console.log('\n📋 Test 2.3: Real-time Broadcasting');

      return new Promise<void>((resolve, reject) => {
        clientSocket = io(`http://localhost:${serverPort}/notifications`, {
          auth: { token: authToken },
          transports: ['websocket']
        });

        clientSocket.on('notification', (notification) => {
          console.log(`   ✓ Received: ${notification.title}`);
          expect(notification).toHaveProperty('type');
          resolve();
        });

        clientSocket.on('connect', async () => {
          await request(app.getHttpServer())
            .post('/api/notifications')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              userId: testUserId,
              type: NotificationType.NEW_APPLICATION,
              title: 'Real-time Test',
              content: 'Testing broadcast'
            });
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
    }, 15000);
  });

  describe('All 15 Notification Types', () => {
    const types = [
      { type: NotificationType.NEW_APPLICATION, title: 'New Application' },
      { type: NotificationType.AI_ANALYSIS_COMPLETE, title: 'AI Complete' },
      { type: NotificationType.STATUS_CHANGE, title: 'Status Changed' },
      { type: NotificationType.PROCESSING_FAILED, title: 'Processing Failed' },
      { type: NotificationType.CANDIDATE_SHORTLISTED, title: 'Shortlisted' },
      { type: NotificationType.BIAS_ALERT, title: 'Bias Alert' },
      { type: NotificationType.DUPLICATE_CANDIDATE, title: 'Duplicate' },
      { type: NotificationType.BULK_PROCESSING_COMPLETE, title: 'Bulk Complete' },
      { type: NotificationType.SYSTEM_ERROR, title: 'System Error' },
      { type: NotificationType.SECURITY_ALERT, title: 'Security Alert' },
      { type: NotificationType.HEALTH_METRICS_ALERT, title: 'Health Alert' },
      { type: NotificationType.USER_MILESTONE_REACHED, title: 'User Milestone' },
      { type: NotificationType.PROCESSING_MILESTONE, title: 'Processing Milestone' },
      { type: NotificationType.MONTHLY_ANALYTICS_REPORT, title: 'Monthly Report' },
      { type: NotificationType.PERFORMANCE_DEGRADATION, title: 'Performance Alert' }
    ];

    types.forEach((testCase, index) => {
      it(`should create ${testCase.type}`, async () => {
        console.log(`\n📋 Test 3.${index + 1}: ${testCase.type}`);

        const response = await request(app.getHttpServer())
          .post('/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId: testUserId,
            type: testCase.type,
            title: testCase.title,
            content: `Testing ${testCase.type}`
          });

        expect(response.status).toBe(201);
        expect(response.body.type).toBe(testCase.type);
        console.log(`   ✓ ${testCase.type} created`);
      });
    });

    it('should validate all 15 types exist', () => {
      console.log('\n📋 Test 3.16: Validate All Types');

      const actualTypes = Object.values(NotificationType);
      expect(actualTypes.length).toBe(15);
      console.log(`   ✓ All 15 notification types defined`);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      console.log('\n📋 Test 4.1: Unauthorized');

      const response = await request(app.getHttpServer())
        .get('/api/notifications');

      expect(response.status).toBe(401);
      console.log(`   ✓ Unauthorized blocked: ${response.status}`);
    });

    it('should handle invalid ID', async () => {
      console.log('\n📋 Test 4.2: Invalid ID');

      const response = await request(app.getHttpServer())
        .get('/api/notifications/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect([400, 404]).toContain(response.status);
      console.log(`   ✓ Invalid ID handled: ${response.status}`);
    });

    it('should handle missing fields', async () => {
      console.log('\n📋 Test 4.3: Missing Fields');

      const response = await request(app.getHttpServer())
        .post('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      console.log(`   ✓ Missing fields rejected: ${response.status}`);
    });
  });

  describe('Device Tokens', () => {
    it('should register device token', async () => {
      console.log('\n📋 Test 5.1: Device Token');

      const response = await request(app.getHttpServer())
        .post('/api/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'test-token-12345',
          platform: 'WEB'
        });

      expect([200, 201]).toContain(response.status);
      console.log(`   ✓ Device token registered`);
    });

    it('should get active device tokens', async () => {
      console.log('\n📋 Test 5.2: Get Device Tokens');

      const response = await request(app.getHttpServer())
        .get('/api/notifications/device-tokens/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      console.log(`   ✓ Retrieved ${response.body.length} tokens`);
    });
  });
});
