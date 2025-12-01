import { Injectable } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { QueueService } from '../queue/queue.service';
import { LinkedInScraperService } from './services/linkedin-scraper.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class UploadService {
  constructor(
    private candidatesService: CandidatesService,
    private queueService: QueueService,
    private linkedinScraperService: LinkedInScraperService,
  ) {}

  async processResume(file: Express.Multer.File, jobRole: string) {
    // Extract text from file
    const rawText = await this.extractTextFromFile(file);
    
    // Create candidate record
    const candidate = await this.candidatesService.create({
      name: 'Extracted from Resume', // Will be updated by AI
      rawText,
      jobRole,
      status: 'pending' as any,
    });

    // Add to AI processing queue
    await this.queueService.addAIProcessingJob(candidate._id.toString(), jobRole);

    return {
      candidateId: candidate._id,
      message: 'Resume uploaded successfully. Processing started.',
      status: 'pending',
    };
  }

  async processLinkedinProfile(linkedinUrl: string, jobRole: string) {
    try {
      // Scrape LinkedIn profile with real data
      const profileData = await this.linkedinScraperService.scrapeProfile(linkedinUrl);
      
      // Create candidate record with scraped data
      const candidate = await this.candidatesService.create({
        name: profileData.name || 'LinkedIn Profile User',
        linkedinUrl,
        rawText: profileData.rawText,
        jobRole,
        status: 'pending' as any,
        // Pre-populate some fields from LinkedIn data
        skills: profileData.skills.slice(0, 10), // Limit to first 10 skills
      });

      // Add to AI processing queue
      await this.queueService.addAIProcessingJob(candidate._id.toString(), jobRole);

      return {
        candidateId: candidate._id,
        message: `LinkedIn profile processed successfully. Extracted: ${profileData.name}`,
        status: 'pending',
        extractedData: {
          name: profileData.name,
          headline: profileData.headline,
          skillsFound: profileData.skills.length,
          experienceItems: profileData.experience.length
        }
      };
    } catch (error) {
      // Fallback to basic processing if scraping fails
      const candidate = await this.candidatesService.create({
        name: 'LinkedIn Profile User',
        linkedinUrl,
        rawText: `LinkedIn Profile: ${linkedinUrl}\n\nNote: Could not extract profile data automatically. Error: ${error.message}`,
        jobRole,
        status: 'pending' as any,
      });

      await this.queueService.addAIProcessingJob(candidate._id.toString(), jobRole);

      return {
        candidateId: candidate._id,
        message: 'LinkedIn URL processed (limited data extraction)',
        status: 'pending',
        warning: 'Could not extract full profile data. Profile may be private or restricted.'
      };
    }
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.text;
    } else if (file.mimetype.includes('word')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    throw new Error('Unsupported file type');
  }
}