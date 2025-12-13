import { Injectable } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { BrevoConfig } from '../../config/brevo.config';

@Injectable()
export class EmailService {
  private apiInstance: any;

  constructor(private brevoConfig: BrevoConfig) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.brevoConfig.apiKey;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string,
  ): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password/${resetToken}`;
    const greeting = userName ? `Hi ${userName},` : 'Hi,';

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: this.brevoConfig.fromName,
      email: this.brevoConfig.fromEmail,
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = 'Password Reset Request';
    sendSmtpEmail.htmlContent = `
      <h2>Password Reset Request</h2>
      <p>${greeting}</p>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }

  async sendPasswordResetConfirmation(
    to: string,
    userName?: string,
  ): Promise<void> {
    const greeting = userName ? `Hi ${userName},` : 'Hi,';

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: this.brevoConfig.fromName,
      email: this.brevoConfig.fromEmail,
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = 'Password Reset Successful';
    sendSmtpEmail.htmlContent = `
      <h2>Password Reset Successful</h2>
      <p>${greeting}</p>
      <p>Your password has been successfully reset.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `;

    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }
}
