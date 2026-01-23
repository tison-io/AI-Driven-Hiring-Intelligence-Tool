import Stripe from 'stripe';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

export interface SubscriptionEventData {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
}

export interface InvoiceEventData {
  id: string;
  customer: string;
  amount_paid: number;
  status: string;
  subscription: string;
}

export interface WebhookHandlerResult {
  received: boolean;
  error?: string;
}