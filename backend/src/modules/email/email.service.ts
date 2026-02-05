import { Injectable } from '@nestjs/common';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { BrevoConfig } from '../../config/brevo.config';
import escapeHtml from "escape-html"

@Injectable()
export class EmailService {
  private apiInstance: any;

  constructor(private brevoConfig: BrevoConfig) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.brevoConfig.apiKey;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reset-password/${resetToken}`;
    const greeting = userName ? `Hi ${userName},` : 'Hi,';
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: this.brevoConfig.fromName, email: this.brevoConfig.fromEmail };
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

  async sendPasswordResetConfirmation(to: string, userName?: string): Promise<void> {
    const greeting = userName ? `Hi ${userName},` : 'Hi,';
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: this.brevoConfig.fromName, email: this.brevoConfig.fromEmail };
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

  async sendVerificationEmail(to: string, code: string, userName?: string): Promise<void> {
    const greeting = userName ? `Hi ${userName},` : 'Hi,';
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: this.brevoConfig.fromName, email: this.brevoConfig.fromEmail };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = 'Verify Your Email Address';
    sendSmtpEmail.htmlContent = `
      <h2 style="margin-bottom: 12px;">Verify Your Email Address</h2>
      
      <p style="margin: 0 0 12px 0;">
        ${greeting}
      </p>
      <p style="margin: 0 0 16px 0;>You’re receiving this because an account was created using this email address.</p>

      <p style="margin: 0 0 16px 0;">
        Thanks for signing up! To complete your registration, please enter the verification code below:
      </p>
      
      <div
        style="
          background-color: #f4f4f4;
          padding: 16px;
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 6px;
          border-radius: 6px;
          margin: 24px 0;
        "
      >
        ${code}
      </div>
      
      <p style="margin: 0 0 8px 0;">
        ⏱️ This code will expire in <strong>15 minutes</strong>.
      </p>
      
      <p style="margin: 0 0 8px 0; color: #555;">
        If you didn't create an account, you can safely ignore this email.
      </p>

      <p style="font-size: 12px; color: #777;">
      For security reasons, <strong>never share this code with anyone</strong>.
      </p>

    `;

    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }
}
