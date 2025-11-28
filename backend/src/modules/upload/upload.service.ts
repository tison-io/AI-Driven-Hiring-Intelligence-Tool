import { Injectable } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { QueueService } from '../queue/queue.service';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

@Injectable()
export class UploadService {
  constructor(
    private candidatesService: CandidatesService,
    private queueService: QueueService,
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
    // Scrape LinkedIn profile (placeholder)
    const rawText = `LinkedIn Profile: ${linkedinUrl}`;
    
    // Create candidate record
    const candidate = await this.candidatesService.create({
      name: 'LinkedIn Profile', // Will be updated by AI
      linkedinUrl,
      rawText,
      jobRole,
      status: 'pending' as any,
    });

    // Add to AI processing queue
    await this.queueService.addAIProcessingJob(candidate._id.toString(), jobRole);

    return {
      candidateId: candidate._id,
      message: 'LinkedIn profile processing started.',
      status: 'pending',
    };
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