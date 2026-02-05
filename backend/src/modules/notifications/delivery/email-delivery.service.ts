import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import { NotificationType } from '../enums/notification-type.enum';

export interface EmailNotificationData {
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private apiInstance: SibApiV3Sdk.TransactionalEmailsApi;

  constructor(private configService: ConfigService) {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = this.configService.get<string>('BREVO_API_KEY');
    
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendCriticalAlert(data: EmailNotificationData): Promise<boolean> {
    if (data.priority !== 'critical') {
      return false;
    }

    try {
      const emailData = {
        to: [{ email: data.userEmail }],
        sender: { 
          email: this.configService.get<string>('BREVO_SENDER_EMAIL', 'noreply@talentscan.ai'),
          name: 'TalentScan AI'
        },
        subject: `🚨 Critical Alert: ${data.title}`,
        htmlContent: this.generateEmailTemplate(data),
        textContent: this.generateTextContent(data),
      };

      await this.apiInstance.sendTransacEmail(emailData);
      this.logger.log(`Critical email sent to ${data.userEmail} for ${data.type}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send critical email: ${error.message}`);
      return false;
    }
  }

  private generateEmailTemplate(data: EmailNotificationData): string {
    const typeColors = {
      [NotificationType.SYSTEM_ERROR]: '#dc3545',
      [NotificationType.SECURITY_ALERT]: '#fd7e14',
      [NotificationType.PERFORMANCE_DEGRADATION]: '#ffc107',
      [NotificationType.HEALTH_METRICS_ALERT]: '#17a2b8',
    };

    const color = typeColors[data.type] || '#6c757d';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Critical Alert - TalentScan AI</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Critical Alert</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${data.title}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6;">
            <h2 style="color: ${color}; margin-top: 0;">Alert Details</h2>
            <p><strong>Type:</strong> ${data.type.replace(/_/g, ' ')}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-left: 4px solid ${color}; margin: 10px 0;">
              ${data.content}
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              This is an automated critical alert from TalentScan AI.<br>
              Please log in to your dashboard for more details.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTextContent(data: EmailNotificationData): string {
    return `
CRITICAL ALERT - TalentScan AI

${data.title}

Type: ${data.type.replace(/_/g, ' ')}
Time: ${new Date().toLocaleString()}

Message:
${data.content}

This is an automated critical alert from TalentScan AI.
Please log in to your dashboard for more details.
    `.trim();
  }
}