import { Injectable } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PrivacyService {
  constructor(
    private candidatesService: CandidatesService,
    private usersService: UsersService,
  ) {}

  async getPrivacyPolicy() {
    return {
      title: 'Privacy Policy - AI Hiring Intelligence Tool',
      lastUpdated: '2024-01-15',
      content: {
        dataCollection: 'We collect resumes, LinkedIn profiles, and job role information for candidate evaluation purposes.',
        dataUsage: 'Data is processed by AI systems to generate hiring insights, role fit scores, and interview recommendations.',
        dataStorage: 'All data is stored securely with encryption. Resume files are treated as sensitive PII.',
        dataRetention: 'Candidate data is retained for 2 years unless deletion is requested.',
        userRights: 'Users have the right to export, modify, or delete their data at any time.',
        biasDisclaimer: 'AI evaluations may contain bias. Results should be used as screening tools only with human oversight.',
        contact: 'For privacy concerns, contact: privacy@hiringtool.com'
      }
    };
  }

  async getRetentionPolicy() {
    return {
      title: 'Data Retention Policy',
      policies: {
        candidateData: {
          retentionPeriod: '2 years',
          description: 'Resume content, LinkedIn profiles, and AI evaluations',
          autoCleanup: false  // DISABLED: Prevent automated deletions
        },
        userData: {
          retentionPeriod: 'Until account deletion',
          description: 'User accounts, authentication data, and preferences'
        },
        logs: {
          retentionPeriod: '90 days',
          description: 'System logs and audit trails'
        }
      },
      deletionProcess: 'Data is permanently deleted and cannot be recovered after retention period or upon user request.'
    };
  }

  async exportUserData(userId: string) {
    const user = await this.usersService.findById(userId);
    const candidates = await this.candidatesService.findByUserId(userId);

    return {
      exportDate: new Date().toISOString(),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date()
      },
      candidates: candidates.map(candidate => ({
        id: candidate._id,
        name: candidate.name,
        jobRole: candidate.jobRole,
        roleFitScore: candidate.roleFitScore,
        skills: candidate.skills,
        createdAt: candidate.createdAt,
        linkedinUrl: candidate.linkedinUrl
      })),
      summary: {
        totalCandidates: candidates.length,
        dataTypes: ['User Profile', 'Candidate Evaluations', 'AI Analysis Results']
      }
    };
  }

  async deleteUserData(userId: string) {
    // Delete all candidates associated with user
    await this.candidatesService.deleteByUserId(userId);
    
    // Delete user account
    await this.usersService.delete(userId);

    return {
      success: true,
      message: 'All user data has been permanently deleted',
      deletedAt: new Date().toISOString(),
      deletedData: ['User account', 'Candidate records', 'AI evaluations', 'Uploaded files']
    };
  }
}