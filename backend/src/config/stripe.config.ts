import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeConfig {
  constructor(private configService: ConfigService) {
    this.validateConfig();
  }

  private validateConfig(): void {
    const requiredKeys = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'];
    
    for (const key of requiredKeys) {
      if (!this.configService.get<string>(key)) {
        throw new Error(`Missing required Stripe configuration: ${key}`);
      }
    }
  }

  get secretKey(): string {
    return this.configService.get<string>('STRIPE_SECRET_KEY');
  }

  get webhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  get allowedIPs(): string[] {
    // Stripe webhook IPs - these may change, check Stripe docs periodically
    // Source: https://stripe.com/docs/webhooks/signatures#verify-official-libraries
    const defaultStripeIPs = [
      '54.187.174.169',
      '54.187.205.235', 
      '54.187.216.72',
      '54.241.31.99',
      '54.241.31.102',
      '54.241.34.107'
    ];
    
    const additionalIPs = this.configService.get<string>('STRIPE_ADDITIONAL_IPS');
    const envIPs = additionalIPs ? additionalIPs.split(',').map(ip => ip.trim()) : [];
    
    // Combine and deduplicate IPs
    return [...new Set([...defaultStripeIPs, ...envIPs])];
  }
}