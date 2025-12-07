import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ResendConfig } from '../../config/resend.config';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private resendConfig: ResendConfig) {
    this.resend = new Resend(this.resendConfig.apiKey);
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${resetToken}`;
    const greeting = userName ? `Hi ${userName},` : 'Hi,';
    
    await this.resend.emails.send({
      from: this.resendConfig.fromEmail,
      to,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>${greeting}</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetConfirmation(to: string, userName?: string): Promise<void> {
    const greeting = userName ? `Hi ${userName},` : 'Hi,';
    
    await this.resend.emails.send({
      from: this.resendConfig.fromEmail,
      to,
      subject: 'Password Reset Successful',
      html: `
        <h2>Password Reset Successful</h2>
        <p>${greeting}</p>
        <p>Your password has been successfully reset.</p>
        <p>If you didn't make this change, please contact support immediately.</p>
      `,
    });
  }
}
