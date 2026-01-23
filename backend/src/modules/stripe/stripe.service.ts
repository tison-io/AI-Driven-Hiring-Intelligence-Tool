import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeConfig } from '../../config/stripe.config';
import { SubscriptionEventData, InvoiceEventData } from './interfaces/stripe.interfaces';
import { ErrorLogsService } from '../error-logs/error-logs.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private stripeConfig: StripeConfig,
    private errorLogsService: ErrorLogsService,
    private auditLogsService: AuditLogsService,
  ) {
    this.stripe = new Stripe(this.stripeConfig.secretKey, {
      apiVersion: '2024-06-20',
    });
  }

  getStripe(): Stripe {
    return this.stripe;
  }

  async handleSubscriptionCreated(data: SubscriptionEventData): Promise<void> {
    try {
      this.logger.log(`Processing subscription created: ${data.id}`);
      
      // Business logic: Update user subscription status
      await this.updateUserSubscription(data.customer, data.id, 'active');
      
      await this.auditLogsService.log({
        action: 'subscription_created',
        userId: data.customer,
        details: { subscriptionId: data.id, status: data.status },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.errorLogsService.log({
        error: errorMessage,
        context: 'StripeService.handleSubscriptionCreated',
        metadata: { subscriptionId: data.id },
      });
      throw error;
    }
  }

  async handleSubscriptionUpdated(data: SubscriptionEventData): Promise<void> {
    try {
      this.logger.log(`Processing subscription updated: ${data.id}`);
      
      // Business logic: Update subscription status
      await this.updateUserSubscription(data.customer, data.id, data.status);
      
      await this.auditLogsService.log({
        action: 'subscription_updated',
        userId: data.customer,
        details: { subscriptionId: data.id, status: data.status },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.errorLogsService.log({
        error: errorMessage,
        context: 'StripeService.handleSubscriptionUpdated',
        metadata: { subscriptionId: data.id },
      });
      throw error;
    }
  }

  async handleSubscriptionDeleted(data: SubscriptionEventData): Promise<void> {
    try {
      this.logger.log(`Processing subscription deleted: ${data.id}`);
      
      // Business logic: Deactivate user subscription
      await this.updateUserSubscription(data.customer, data.id, 'canceled');
      
      await this.auditLogsService.log({
        action: 'subscription_deleted',
        userId: data.customer,
        details: { subscriptionId: data.id },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.errorLogsService.log({
        error: errorMessage,
        context: 'StripeService.handleSubscriptionDeleted',
        metadata: { subscriptionId: data.id },
      });
      throw error;
    }
  }

  async handlePaymentSucceeded(data: InvoiceEventData): Promise<void> {
    try {
      this.logger.log(`Processing payment succeeded: ${data.id}`);
      
      // Business logic: Update payment status
      await this.recordPayment(data.customer, data.id, data.amount_paid, 'succeeded');
      
      await this.auditLogsService.log({
        action: 'payment_succeeded',
        userId: data.customer,
        details: { invoiceId: data.id, amount: data.amount_paid },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.errorLogsService.log({
        error: errorMessage,
        context: 'StripeService.handlePaymentSucceeded',
        metadata: { invoiceId: data.id },
      });
      throw error;
    }
  }

  async handlePaymentFailed(data: InvoiceEventData): Promise<void> {
    try {
      this.logger.warn(`Processing payment failed: ${data.id}`);
      
      // Business logic: Handle failed payment
      await this.recordPayment(data.customer, data.id, 0, 'failed');
      await this.notifyPaymentFailure(data.customer, data.id);
      
      await this.auditLogsService.log({
        action: 'payment_failed',
        userId: data.customer,
        details: { invoiceId: data.id },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.errorLogsService.log({
        error: errorMessage,
        context: 'StripeService.handlePaymentFailed',
        metadata: { invoiceId: data.id },
      });
      throw error;
    }
  }

  private async updateUserSubscription(customerId: string, subscriptionId: string, status: string): Promise<void> {
    // Implementation would update user's subscription in database
    this.logger.debug(`Updating subscription ${subscriptionId} for customer ${customerId} to status: ${status}`);
  }

  private async recordPayment(customerId: string, invoiceId: string, amount: number, status: string): Promise<void> {
    // Implementation would record payment in database
    this.logger.debug(`Recording payment ${invoiceId} for customer ${customerId}: ${amount} - ${status}`);
  }

  private async notifyPaymentFailure(customerId: string, invoiceId: string): Promise<void> {
    // Implementation would send notification to user
    this.logger.debug(`Notifying customer ${customerId} of payment failure for invoice ${invoiceId}`);
  }
}