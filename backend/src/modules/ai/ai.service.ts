import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  constructor(private configService: ConfigService) {}

  async evaluateCandidate(rawText: string, jobRole: string) {
    // Placeholder for AI service integration
    // This will be replaced with actual AI service calls
    
    const mockAiResponse = {
      name: 'John Doe', // Extracted from text
      roleFitScore: Math.floor(Math.random() * 40) + 60, // 60-100
      keyStrengths: [
        'Strong technical background',
        'Good communication skills',
        'Relevant experience'
      ],
      potentialWeaknesses: [
        'Limited leadership experience',
        'Could improve in specific technology'
      ],
      missingSkills: [
        'Docker',
        'Kubernetes'
      ],
      interviewQuestions: [
        'Tell me about your experience with microservices',
        'How do you handle code reviews?',
        'Describe a challenging project you worked on'
      ],
      confidenceScore: Math.floor(Math.random() * 20) + 80, // 80-100
      biasCheck: 'No significant bias detected in evaluation',
      skills: ['JavaScript', 'Node.js', 'React', 'MongoDB'],
      experienceYears: Math.floor(Math.random() * 10) + 2, // 2-12 years
    };

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return mockAiResponse;
  }

  async extractSkills(rawText: string): Promise<string[]> {
    // Placeholder for skill extraction
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 
      'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Git'
    ];
    
    return commonSkills.filter(() => Math.random() > 0.7);
  }
}