import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './enums/notification-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { ProcessingStatus } from '../../common/enums/processing-status.enum';

export interface CandidateProcessingEvent {
  candidateId: string;
  candidateName: string;
  userId: string;
  jobRole?: string;
  status?: ProcessingStatus;
  processingTime?: number;
  error?: string;
}

export interface CandidateManagementEvent {
  candidateId: string;
  candidateName: string;
  userId: string;
  action: 'shortlisted' | 'removed_from_shortlist' | 'deleted' | 'bias_detected' | 'duplicate_found';
  biasDetails?: any;
  duplicateDetails?: any;
}

export interface BulkProcessingEvent {
  userId: string;
  totalCandidates: number;
  successCount: number;
  failedCount: number;
  processingTime: number;
  failedCandidates?: string[];
}

export interface SystemAlertEvent {
  type: 'error' | 'security' | 'health' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  affectedUsers?: string[];
}

export interface MilestoneEvent {
  type: 'user_count' | 'processing_count';
  milestone: number;
  currentValue: number;
  adminUsers: string[];
}

@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Candidate Processing Events
  @OnEvent('candidate.application.new')
  async handleNewApplication(event: CandidateProcessingEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.NEW_APPLICATION,
        title: 'New Application Received',
        content: `New candidate "${event.candidateName}" has applied for ${event.jobRole || 'a position'}`,
        metadata: {
          candidateId: event.candidateId,
          jobRole: event.jobRole,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`New application notification sent for candidate ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send new application notification', error);
    }
  }

  @OnEvent('candidate.status.changed')
  async handleStatusChange(event: CandidateProcessingEvent) {
    try {
      const statusMessages = {
        [ProcessingStatus.PENDING]: 'is pending processing',
        [ProcessingStatus.PROCESSING]: 'is being processed',
        [ProcessingStatus.COMPLETED]: 'has been successfully processed',
        [ProcessingStatus.FAILED]: 'processing has failed',
      };

      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.STATUS_CHANGE,
        title: 'Candidate Status Updated',
        content: `Candidate "${event.candidateName}" ${statusMessages[event.status] || 'status has changed'}`,
        metadata: {
          candidateId: event.candidateId,
          previousStatus: event.status,
          newStatus: event.status,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Status change notification sent for candidate ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send status change notification', error);
    }
  }

  @OnEvent('candidate.ai.analysis.complete')
  async handleAIAnalysisComplete(event: CandidateProcessingEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.AI_ANALYSIS_COMPLETE,
        title: 'AI Analysis Complete',
        content: `AI analysis completed for "${event.candidateName}" in ${event.processingTime}ms`,
        metadata: {
          candidateId: event.candidateId,
          processingTime: event.processingTime,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`AI analysis complete notification sent for candidate ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send AI analysis complete notification', error);
    }
  }

  @OnEvent('candidate.processing.failed')
  async handleProcessingFailed(event: CandidateProcessingEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.PROCESSING_FAILED,
        title: 'Processing Failed',
        content: `Processing failed for candidate "${event.candidateName}". ${event.error || 'Please try again.'}`,
        metadata: {
          candidateId: event.candidateId,
          error: event.error,
          processingTime: event.processingTime,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Processing failed notification sent for candidate ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send processing failed notification', error);
    }
  }

  // Candidate Management Events
  @OnEvent('candidate.shortlisted')
  async handleCandidateShortlisted(event: CandidateManagementEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.CANDIDATE_SHORTLISTED,
        title: 'Candidate Shortlisted',
        content: `Candidate "${event.candidateName}" has been added to your shortlist`,
        metadata: {
          candidateId: event.candidateId,
          action: event.action,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Candidate shortlisted notification sent for ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send candidate shortlisted notification', error);
    }
  }

  @OnEvent('candidate.removed.from.shortlist')
  async handleCandidateRemovedFromShortlist(event: CandidateManagementEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.CANDIDATE_SHORTLISTED,
        title: 'Candidate Removed from Shortlist',
        content: `Candidate "${event.candidateName}" has been removed from your shortlist`,
        metadata: {
          candidateId: event.candidateId,
          action: event.action,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Candidate removed from shortlist notification sent for ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send candidate removed from shortlist notification', error);
    }
  }

  @OnEvent('candidate.deleted')
  async handleCandidateDeleted(event: CandidateManagementEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.STATUS_CHANGE,
        title: 'Candidate Deleted',
        content: `Candidate "${event.candidateName}" has been permanently deleted from the system`,
        metadata: {
          candidateId: event.candidateId,
          action: event.action,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Candidate deleted notification sent for ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send candidate deleted notification', error);
    }
  }

  @OnEvent('candidate.bias.detected')
  async handleBiasAlert(event: CandidateManagementEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.BIAS_ALERT,
        title: 'Bias Detection Alert',
        content: `Potential bias detected in evaluation of "${event.candidateName}". Please review.`,
        metadata: {
          candidateId: event.candidateId,
          biasDetails: event.biasDetails,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Bias alert notification sent for candidate ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send bias alert notification', error);
    }
  }

  @OnEvent('candidate.duplicate.found')
  async handleDuplicateCandidate(event: CandidateManagementEvent) {
    try {
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.DUPLICATE_CANDIDATE,
        title: 'Duplicate Candidate Detected',
        content: `Duplicate candidate detected: "${event.candidateName}" may already exist in the system`,
        metadata: {
          candidateId: event.candidateId,
          duplicateDetails: event.duplicateDetails,
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Duplicate candidate notification sent for ${event.candidateId}`);
    } catch (error) {
      this.logger.error('Failed to send duplicate candidate notification', error);
    }
  }

  // Bulk Operations
  @OnEvent('bulk.processing.complete')
  async handleBulkProcessingComplete(event: BulkProcessingEvent) {
    try {
      const successRate = ((event.successCount / event.totalCandidates) * 100).toFixed(1);
      
      await this.notificationsService.create({
        userId: event.userId,
        type: NotificationType.BULK_PROCESSING_COMPLETE,
        title: 'Bulk Processing Complete',
        content: `Processed ${event.totalCandidates} candidates: ${event.successCount} successful, ${event.failedCount} failed (${successRate}% success rate)`,
        metadata: {
          totalCandidates: event.totalCandidates,
          successCount: event.successCount,
          failedCount: event.failedCount,
          processingTime: event.processingTime,
          failedCandidates: event.failedCandidates,
          successRate: parseFloat(successRate),
          timestamp: new Date(),
        },
      }, UserRole.RECRUITER);

      this.logger.log(`Bulk processing complete notification sent to user ${event.userId}`);
    } catch (error) {
      this.logger.error('Failed to send bulk processing complete notification', error);
    }
  }

  // Admin System Alerts
  @OnEvent('system.error')
  async handleSystemError(event: SystemAlertEvent) {
    try {
      const adminUsers = event.affectedUsers || await this.getAdminUsers();
      
      for (const adminId of adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.SYSTEM_ERROR,
          title: `System Error - ${event.severity.toUpperCase()}`,
          content: event.message,
          metadata: {
            severity: event.severity,
            details: event.details,
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`System error notifications sent to ${adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send system error notifications', error);
    }
  }

  @OnEvent('security.alert')
  async handleSecurityAlert(event: SystemAlertEvent) {
    try {
      const adminUsers = event.affectedUsers || await this.getAdminUsers();
      
      for (const adminId of adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.SECURITY_ALERT,
          title: `Security Alert - ${event.severity.toUpperCase()}`,
          content: event.message,
          metadata: {
            severity: event.severity,
            details: event.details,
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`Security alert notifications sent to ${adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send security alert notifications', error);
    }
  }

  @OnEvent('health.metrics.alert')
  async handleHealthMetricsAlert(event: SystemAlertEvent) {
    try {
      const adminUsers = event.affectedUsers || await this.getAdminUsers();
      
      for (const adminId of adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.HEALTH_METRICS_ALERT,
          title: `Health Metrics Alert`,
          content: event.message,
          metadata: {
            severity: event.severity,
            details: event.details,
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`Health metrics alert notifications sent to ${adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send health metrics alert notifications', error);
    }
  }

  @OnEvent('performance.degradation')
  async handlePerformanceDegradation(event: SystemAlertEvent) {
    try {
      const adminUsers = event.affectedUsers || await this.getAdminUsers();
      
      for (const adminId of adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.PERFORMANCE_DEGRADATION,
          title: `Performance Degradation Detected`,
          content: event.message,
          metadata: {
            severity: event.severity,
            details: event.details,
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`Performance degradation notifications sent to ${adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send performance degradation notifications', error);
    }
  }

  // Business Intelligence Events
  @OnEvent('milestone.user.reached')
  async handleUserMilestoneReached(event: MilestoneEvent) {
    try {
      for (const adminId of event.adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.USER_MILESTONE_REACHED,
          title: `User Milestone Reached!`,
          content: `Congratulations! The platform has reached ${event.milestone} users (current: ${event.currentValue})`,
          metadata: {
            milestone: event.milestone,
            currentValue: event.currentValue,
            milestoneType: event.type,
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`User milestone notifications sent to ${event.adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send user milestone notifications', error);
    }
  }

  @OnEvent('milestone.processing.reached')
  async handleProcessingMilestoneReached(event: MilestoneEvent) {
    try {
      for (const adminId of event.adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.PROCESSING_MILESTONE,
          title: `Processing Milestone Reached!`,
          content: `The platform has processed ${event.milestone} candidates (current: ${event.currentValue})`,
          metadata: {
            milestone: event.milestone,
            currentValue: event.currentValue,
            milestoneType: event.type,
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`Processing milestone notifications sent to ${event.adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send processing milestone notifications', error);
    }
  }

  @OnEvent('analytics.monthly.report')
  async handleMonthlyAnalyticsReport(event: { adminUsers: string[]; reportData: any }) {
    try {
      for (const adminId of event.adminUsers) {
        await this.notificationsService.create({
          userId: adminId,
          type: NotificationType.MONTHLY_ANALYTICS_REPORT,
          title: `Monthly Analytics Report Available`,
          content: `Your monthly analytics report is ready. View insights on user activity, processing metrics, and system performance.`,
          metadata: {
            reportData: event.reportData,
            reportMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
            timestamp: new Date(),
          },
        }, UserRole.ADMIN);
      }

      this.logger.log(`Monthly analytics report notifications sent to ${event.adminUsers.length} admins`);
    } catch (error) {
      this.logger.error('Failed to send monthly analytics report notifications', error);
    }
  }

  // Helper Methods
  private async getAdminUsers(): Promise<string[]> {
    // This would typically query the users service to get admin user IDs
    // For now, returning empty array - this should be implemented based on your user service
    return [];
  }

  // Public methods to emit events from other services
  emitNewApplication(event: CandidateProcessingEvent) {
    this.eventEmitter.emit('candidate.application.new', event);
  }

  emitStatusChange(event: CandidateProcessingEvent) {
    this.eventEmitter.emit('candidate.status.changed', event);
  }

  emitAIAnalysisComplete(event: CandidateProcessingEvent) {
    this.eventEmitter.emit('candidate.ai.analysis.complete', event);
  }

  emitProcessingFailed(event: CandidateProcessingEvent) {
    this.eventEmitter.emit('candidate.processing.failed', event);
  }

  emitCandidateShortlisted(event: CandidateManagementEvent) {
    this.eventEmitter.emit('candidate.shortlisted', event);
  }

  emitCandidateRemovedFromShortlist(event: CandidateManagementEvent) {
    this.eventEmitter.emit('candidate.removed.from.shortlist', event);
  }

  emitCandidateDeleted(event: CandidateManagementEvent) {
    this.eventEmitter.emit('candidate.deleted', event);
  }

  emitBiasDetected(event: CandidateManagementEvent) {
    this.eventEmitter.emit('candidate.bias.detected', event);
  }

  emitDuplicateFound(event: CandidateManagementEvent) {
    this.eventEmitter.emit('candidate.duplicate.found', event);
  }

  emitBulkProcessingComplete(event: BulkProcessingEvent) {
    this.eventEmitter.emit('bulk.processing.complete', event);
  }

  emitSystemError(event: SystemAlertEvent) {
    this.eventEmitter.emit('system.error', event);
  }

  emitSecurityAlert(event: SystemAlertEvent) {
    this.eventEmitter.emit('security.alert', event);
  }

  emitHealthMetricsAlert(event: SystemAlertEvent) {
    this.eventEmitter.emit('health.metrics.alert', event);
  }

  emitPerformanceDegradation(event: SystemAlertEvent) {
    this.eventEmitter.emit('performance.degradation', event);
  }

  emitUserMilestoneReached(event: MilestoneEvent) {
    this.eventEmitter.emit('milestone.user.reached', event);
  }

  emitProcessingMilestoneReached(event: MilestoneEvent) {
    this.eventEmitter.emit('milestone.processing.reached', event);
  }

  emitMonthlyAnalyticsReport(event: { adminUsers: string[]; reportData: any }) {
    this.eventEmitter.emit('analytics.monthly.report', event);
  }
}