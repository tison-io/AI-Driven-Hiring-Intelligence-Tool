import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Controllers
import { AppController } from './app.controller';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { UploadModule } from './modules/upload/upload.module';
import { ExportModule } from './modules/export/export.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { QueueModule } from './modules/queue/queue.module';
import { AiModule } from './modules/ai/ai.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { JobPostingsModule } from './modules/job-postings/job-postings.module';
import { ErrorLoggingInterceptor } from './common/interceptors/error-logging.interceptor';
import { AuditLoggingInterceptor } from './common/interceptors/audit-logging.interceptor';

@Module({
  controllers: [AppController],
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    MongooseModule.forRootAsync({
      useClass: DatabaseConfig,
    }),

    // Redis & Bull Queue
    BullModule.forRootAsync({
      useClass: RedisConfig,
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // Feature modules
    AuthModule,
    UsersModule,
    CandidatesModule,
    UploadModule,
    ExportModule,
    DashboardModule,
    QueueModule,
    AiModule,
    PrivacyModule,
    ErrorLogsModule,
    AuditLogsModule,
    JobPostingsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
  ],
})
export class AppModule {}