import { Controller, Post, Body, Headers, RawBodyRequest, Req, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeConfig } from '../../config/stripe.config';
import Stripe from 'stripe';
import { WebhookHandlerResult } from './interfaces/stripe.interfaces';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeConfig: StripeConfig,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<WebhookHandlerResult> {
    // IP whitelist validation
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    if (clientIP && !this.stripeConfig.allowedIPs.includes(clientIP as string)) {
      this.logger.warn(`Webhook request from unauthorized IP: ${clientIP}`);
      throw new ForbiddenException('Unauthorized IP address');
    }

    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeService.getStripe().webhooks.constructEvent(
        req.rawBody,
        signature,
        this.stripeConfig.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid signature');
    }

    try {
      await this.processWebhookEvent(event);
      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { received: false, error: error.message };
    }
  }

  private async processWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.stripeService.handleSubscriptionCreated(event.data.object as any);
        break;
      case 'customer.subscription.updated':
        await this.stripeService.handleSubscriptionUpdated(event.data.object as any);
        break;
      case 'customer.subscription.deleted':
        await this.stripeService.handleSubscriptionDeleted(event.data.object as any);
        break;
      case 'invoice.payment_succeeded':
        await this.stripeService.handlePaymentSucceeded(event.data.object as any);
        break;
      case 'invoice.payment_failed':
        await this.stripeService.handlePaymentFailed(event.data.object as any);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }
}