import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { NotFoundException, Logger } from '@nestjs/common';
import { CandidatesService } from '../../candidates/candidates.service';
import { AiService } from '../../ai/ai.service';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';
import { NotificationEventService } from '../../notifications/notification-event.service';
import { EmailService } from '../../email/email.service';
import { ResultsTokensService } from '../../results-tokens/results-tokens.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobPosting, JobPostingDocument } from '../../job-postings/entities/job-posting.entity';

@Processor('ai-processing')
export class AiProcessor {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private candidatesService: CandidatesService,
    private aiService: AiService,
    private notificationEventService: NotificationEventService,
    private emailService: EmailService,
    private resultsTokensService: ResultsTokensService,
    private auditLogsService: AuditLogsService,
    @InjectModel(JobPosting.name) private jobPostingModel: Model<JobPostingDocument>,
  ) { }

  @Process('process-candidate')
  async handleAIProcessing(job: Job) {
    const { candidateId, jobRole, jobDescription, userId } = job.data;
    const startTime = Date.now();

    try {
      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.PROCESSING
      });

      const candidate = await this.candidatesService.findById(candidateId);
      if (!candidate) throw new NotFoundException('Candidate not found');

      // Emit status change event
      this.notificationEventService.emitStatusChange({
        candidateId,
        candidateName: candidate.name || 'Unknown',
        userId: userId || candidate.createdBy,
        status: ProcessingStatus.PROCESSING,
      });

      this.logger.log(`Starting Graph Analysis for Candidate ${candidateId}...`);

      const result = await this.aiService.evaluateCandidateGraph(
        candidate.rawText,
        jobRole,
        jobDescription
      );

      const processingTime = Date.now() - startTime;

      await this.candidatesService.update(candidateId, {
        name: result.name,
        skills: result.skills,
        experienceYears: result.experienceYears,
        workExperience: result.workExperience,
        education: result.education,
        certifications: result.certifications,

        roleFitScore: result.roleFitScore,
        scoringBreakdown: result.scoringBreakdown,
        isShortlisted: result.isShortlisted,
        keyStrengths: result.keyStrengths,
        potentialWeaknesses: result.potentialWeaknesses,
        missingSkills: result.missingSkills,
        interviewQuestions: result.interviewQuestions,
        confidenceScore: result.confidenceScore,
        biasCheck: result.biasCheck,

        status: ProcessingStatus.COMPLETED,
        processingTime,
      });

      // Emit AI analysis complete event
      this.notificationEventService.emitAIAnalysisComplete({
        candidateId,
        candidateName: result.name,
        userId: userId || candidate.createdBy,
        jobRole,
        processingTime,
      });

      // Check for bias and emit alert if detected
      if (result.biasCheck && typeof result.biasCheck === 'string' && result.biasCheck.includes('REVIEW REQUIRED')) {
        this.notificationEventService.emitBiasDetected({
          candidateId,
          candidateName: result.name,
          userId: userId || candidate.createdBy,
          action: 'bias_detected',
          biasDetails: result.biasCheck,
        });
      }

      this.logger.log(`Graph Processing Complete for ${candidateId}. Time: ${processingTime}ms`);
      
      // Send email if candidate has email and jobPostingId
      if (candidate.email && candidate.jobPostingId) {
        try {
          const jobPosting = await this.jobPostingModel.findById(candidate.jobPostingId);
          if (jobPosting) {
            const resultsToken = await this.resultsTokensService.generateToken(
              candidateId,
              candidate.jobPostingId,
            );
            
            await this.emailService.sendEvaluationResults(
              candidate.email,
              result.name,
              jobPosting.title,
              result.roleFitScore || 0,
              resultsToken,
              jobPosting.companyName || 'Company',
            );
            
            await this.candidatesService.update(candidateId, { emailSent: true });
            this.logger.log(`Email sent to ${candidate.email} for candidate ${candidateId}`);
            
            // Log email sent to audit logs
            await this.auditLogsService.createLog({
              userOrSystem: 'SYSTEM',
              action: 'EMAIL_SENT',
              target: `Candidate: ${candidateId}`,
              details: `Evaluation results email sent to ${candidate.email} for job: ${jobPosting.title}. Score: ${result.roleFitScore}%. Token: ${resultsToken}`,
            });
          }
        } catch (emailError) {
          this.logger.error(`Failed to send email for candidate ${candidateId}`, emailError.stack);
          
          // Log email failure to audit logs
          await this.auditLogsService.createLog({
            userOrSystem: 'SYSTEM',
            action: 'EMAIL_FAILED',
            target: `Candidate: ${candidateId}`,
            details: `Failed to send evaluation results email to ${candidate.email}. Error: ${emailError.message}`,
          });
        }
      }
      
      return { success: true, candidateId };

    } catch (error) {
      this.logger.error(`Processing failed for candidate ${candidateId}`, error.stack);

      const processingTime = Date.now() - startTime;
      await this.candidatesService.update(candidateId, {
        status: ProcessingStatus.FAILED,
        processingTime,
      });

      // Get candidate info for notification
      const candidate = await this.candidatesService.findById(candidateId);

      // Emit processing failed event
      this.notificationEventService.emitProcessingFailed({
        candidateId,
        candidateName: candidate?.name || 'Unknown',
        userId: userId || candidate?.createdBy,
        error: error.message,
        processingTime,
      });

      throw error;
    }
  }
}