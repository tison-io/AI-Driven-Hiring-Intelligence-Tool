import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AutomationTestService {
  private readonly logger = new Logger(AutomationTestService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  testCronJob() {
    this.logger.log('✅ Cron job automation is working! Current time: ' + new Date().toISOString());
  }
}