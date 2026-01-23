import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeConfig } from '../../config/stripe.config';

@Module({
  imports: [ConfigModule],
  controllers: [StripeController],
  providers: [StripeService, StripeConfig],
  exports: [StripeService],
})
export class StripeModule {}