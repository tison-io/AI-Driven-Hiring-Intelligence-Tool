import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';
let marked: any;
try {
  marked = require('marked').marked;
} catch {
  marked = (text: string) => text;
}

@Injectable()
export class ExportService {
  constructor(private candidatesService: CandidatesService) {}

  async exportCandidatesCSV(filters: any, userId: string, userRole: string): Promise<Buffer> {
    const candidates = await this.candidatesService.findAll(filters, userId, userRole);
    
    const csvData = candidates.map(candidate => ({
      name: candidate.name,
      linkedinUrl: candidate.linkedinUrl || '',
      experienceYears: candidate.experienceYears,
      skills: candidate.skills.join(', '),
      roleFitScore: candidate.roleFitScore || 0,
      confidenceScore: candidate.confidenceScore || 0,
      jobRole: candidate.jobRole,
      status: candidate.status,
      createdAt: candidate.createdAt || new Date(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
  }

  async exportCandidatesXLSX(filters: any, userId: string, userRole: string): Promise<Buffer> {
    const candidates = await this.candidatesService.findAll(filters, userId, userRole);
    
    const xlsxData = candidates.map(candidate => ({
      Name: candidate.name,
      'LinkedIn URL': candidate.linkedinUrl || '',
      'Years of Experience': candidate.experienceYears,
      Skills: candidate.skills.join(', '),
      'Role Fit Score': candidate.roleFitScore || 0,
      'Confidence Score': candidate.confidenceScore || 0,
      'Job Role': candidate.jobRole,
      Status: candidate.status,
      'Created At': candidate.createdAt || new Date(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(xlsxData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async generateCandidateReport(candidateId: string): Promise<string> {
    const candidate = await this.candidatesService.findById(candidateId);
    
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const markdownReport = `
# Hiring Intelligence Report

## Candidate Information
- **Name**: ${candidate.name}
- **Job Role**: ${candidate.jobRole}
- **LinkedIn**: ${candidate.linkedinUrl || 'Not provided'}
- **Experience**: ${candidate.experienceYears} years

## AI Evaluation Results
- **Role Fit Score**: ${candidate.roleFitScore || 'Pending'}/100
- **Confidence Score**: ${candidate.confidenceScore || 'Pending'}%

### Key Strengths
${candidate.keyStrengths.map(strength => `- ${strength}`).join('\n')}

### Potential Weaknesses
${candidate.potentialWeaknesses.map(weakness => `- ${weakness}`).join('\n')}

### Missing Skills
${candidate.missingSkills.map(skill => `- ${skill}`).join('\n')}

### Recommended Interview Questions
${candidate.interviewQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

### Skills
${candidate.skills.map(skill => `- ${skill}`).join('\n')}

### Bias Check
${candidate.biasCheck || 'No bias concerns identified'}

---
*Report generated on ${new Date().toISOString()}*
    `;

    return marked(markdownReport);
  }
}