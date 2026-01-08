import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { CandidateFilterDto } from '../candidates/dto/candidate-filter.dto';
import * as ExcelJS from 'exceljs';
let marked: any;
try {
  marked = require('marked').marked;
} catch {
  marked = (text: string) => text;
}

@Injectable()
export class ExportService {
  constructor(private candidatesService: CandidatesService) {}

  async exportCandidatesCSV(filters: CandidateFilterDto, userId: string, userRole: string): Promise<Buffer> {
    const candidates = await this.candidatesService.findAll(filters, userId, userRole);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'LinkedIn URL', key: 'linkedinUrl', width: 40 },
      { header: 'Experience Years', key: 'experienceYears', width: 15 },
      { header: 'Skills', key: 'skills', width: 50 },
      { header: 'Role Fit Score', key: 'roleFitScore', width: 15 },
      { header: 'Confidence Score', key: 'confidenceScore', width: 15 },
      { header: 'Job Role', key: 'jobRole', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    candidates.forEach(candidate => {
      worksheet.addRow({
        name: candidate.name,
        linkedinUrl: candidate.linkedinUrl || '',
        experienceYears: candidate.experienceYears,
        skills: candidate.skills.join(', '),
        roleFitScore: candidate.roleFitScore || 0,
        confidenceScore: candidate.confidenceScore || 0,
        jobRole: candidate.jobRole,
        status: candidate.status,
        createdAt: candidate.createdAt || new Date(),
      });
    });

    return Buffer.from(await workbook.csv.writeBuffer());
  }

  async exportCandidatesXLSX(filters: CandidateFilterDto, userId: string, userRole: string): Promise<Buffer> {
    const candidates = await this.candidatesService.findAll(filters, userId, userRole);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'LinkedIn URL', key: 'linkedinUrl', width: 40 },
      { header: 'Years of Experience', key: 'experienceYears', width: 20 },
      { header: 'Skills', key: 'skills', width: 50 },
      { header: 'Role Fit Score', key: 'roleFitScore', width: 15 },
      { header: 'Confidence Score', key: 'confidenceScore', width: 18 },
      { header: 'Job Role', key: 'jobRole', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    candidates.forEach(candidate => {
      worksheet.addRow({
        name: candidate.name,
        linkedinUrl: candidate.linkedinUrl || '',
        experienceYears: candidate.experienceYears,
        skills: candidate.skills.join(', '),
        roleFitScore: candidate.roleFitScore || 0,
        confidenceScore: candidate.confidenceScore || 0,
        jobRole: candidate.jobRole,
        status: candidate.status,
        createdAt: candidate.createdAt || new Date(),
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
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