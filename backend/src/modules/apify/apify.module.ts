import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ApifyService } from './apify.service';
import { ApifyConfig } from '../../config/apify.config';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  providers: [
    ApifyService,
    ApifyConfig,
  ],
  exports: [ApifyService],
})
export class ApifyModule {}