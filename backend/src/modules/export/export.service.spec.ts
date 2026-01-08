import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { CandidatesService } from '../candidates/candidates.service';
import * as ExcelJS from 'exceljs';

// Mock ExcelJS
jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue({
        columns: [],
        addRow: jest.fn(),
      }),
      csv: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('csv,data')),
      },
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('xlsx,data')),
      },
    })),
  };
});

describe('ExportService', () => {
  let service: ExportService;
  let candidatesService: jest.Mocked<CandidatesService>;

  const mockCandidates = [
    {
      _id: '1',
      name: 'John Doe',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      experienceYears: 5,
      skills: ['JavaScript', 'Node.js'],
      roleFitScore: 85,
      confidenceScore: 80,
      jobRole: 'Backend Engineer',
      status: 'completed',
      keyStrengths: ['Problem solving', 'Team work'],
      potentialWeaknesses: ['Public speaking'],
      missingSkills: ['Python'],
      interviewQuestions: ['Tell me about yourself', 'Why this role?'],
      biasCheck: 'No bias detected',
      createdAt: new Date('2024-01-15'),
    },
    {
      _id: '2',
      name: 'Jane Smith',
      linkedinUrl: null,
      experienceYears: 3,
      skills: ['React', 'TypeScript'],
      roleFitScore: 75,
      confidenceScore: 70,
      jobRole: 'Frontend Developer',
      status: 'completed',
      keyStrengths: ['UI/UX design'],
      potentialWeaknesses: ['Backend knowledge'],
      missingSkills: ['Node.js'],
      interviewQuestions: ['Describe your React experience'],
      biasCheck: null,
      createdAt: new Date('2024-01-10'),
    },
  ];

  beforeEach(async () => {
    const mockCandidatesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        {
          provide: CandidatesService,
          useValue: mockCandidatesService,
        },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    candidatesService = module.get(CandidatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportCandidatesCSV', () => {
    it('should export candidates to CSV format', async () => {
      // Arrange
      const filters = { skill: 'JavaScript' };
      const userId = 'user123';
      const userRole = 'recruiter';

      candidatesService.findAll.mockResolvedValue(mockCandidates as any);

      // Act
      const result = await service.exportCandidatesCSV(filters, userId, userRole);

      // Assert
      expect(candidatesService.findAll).toHaveBeenCalledWith(filters, userId, userRole);
      expect(result).toBeInstanceOf(Buffer);
      expect(ExcelJS.Workbook).toHaveBeenCalled();
    });

    it('should handle empty candidates list', async () => {
      // Arrange
      const filters = {};
      const userId = 'user123';
      const userRole = 'recruiter';

      candidatesService.findAll.mockResolvedValue([]);

      // Act
      const result = await service.exportCandidatesCSV(filters, userId, userRole);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportCandidatesXLSX', () => {
    it('should export candidates to XLSX format', async () => {
      // Arrange
      const filters = { jobRole: 'Engineer' };
      const userId = 'user123';
      const userRole = 'admin';

      candidatesService.findAll.mockResolvedValue(mockCandidates as any);

      // Act
      const result = await service.exportCandidatesXLSX(filters, userId, userRole);

      // Assert
      expect(candidatesService.findAll).toHaveBeenCalledWith(filters, userId, userRole);
      expect(result).toBeInstanceOf(Buffer);
      expect(ExcelJS.Workbook).toHaveBeenCalled();
    });

    it('should handle candidates with missing optional fields', async () => {
      // Arrange
      const candidateWithMissingFields = [{
        _id: '3',
        name: 'Bob Wilson',
        linkedinUrl: null,
        experienceYears: 2,
        skills: ['Python'],
        roleFitScore: null,
        confidenceScore: null,
        jobRole: 'Data Scientist',
        status: 'pending',
        createdAt: null,
      }];

      candidatesService.findAll.mockResolvedValue(candidateWithMissingFields as any);

      // Act
      const result = await service.exportCandidatesXLSX({}, 'user123', 'recruiter');

      // Assert
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('generateCandidateReport', () => {
    it('should generate HTML report for candidate', async () => {
      // Arrange
      const candidateId = '1';
      candidatesService.findById.mockResolvedValue(mockCandidates[0] as any);

      // Act
      const result = await service.generateCandidateReport(candidateId);

      // Assert
      expect(candidatesService.findById).toHaveBeenCalledWith(candidateId);
      expect(result).toContain('John Doe');
      expect(result).toContain('Backend Engineer');
      expect(result).toContain('85/100');
      expect(result).toContain('Problem solving');
      expect(result).toContain('Public speaking');
      expect(result).toContain('Python');
      expect(result).toContain('Tell me about yourself');
      expect(result).toContain('JavaScript');
      expect(result).toContain('No bias detected');
    });

    it('should handle candidate with missing optional fields in report', async () => {
      // Arrange
      const candidateId = '2';
      candidatesService.findById.mockResolvedValue(mockCandidates[1] as any);

      // Act
      const result = await service.generateCandidateReport(candidateId);

      // Assert
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Not provided'); // For missing LinkedIn
      expect(result).toContain('75/100'); // Actual score value
      expect(result).toContain('No bias concerns identified'); // Default for null biasCheck
    });

    it('should throw error if candidate not found', async () => {
      // Arrange
      const candidateId = 'nonexistent';
      candidatesService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.generateCandidateReport(candidateId)).rejects.toThrow('Candidate not found');
      expect(candidatesService.findById).toHaveBeenCalledWith(candidateId);
    });

    it('should handle empty arrays in report generation', async () => {
      // Arrange
      const candidateWithEmptyArrays = {
        ...mockCandidates[0],
        keyStrengths: [],
        potentialWeaknesses: [],
        missingSkills: [],
        interviewQuestions: [],
        skills: [],
      };
      
      candidatesService.findById.mockResolvedValue(candidateWithEmptyArrays as any);

      // Act
      const result = await service.generateCandidateReport('1');

      // Assert
      expect(result).toBeDefined();
      expect(result).toContain('John Doe');
      // Should not crash with empty arrays
    });
  });

  describe('error handling', () => {
    it('should handle service errors in CSV export', async () => {
      // Arrange
      candidatesService.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.exportCandidatesCSV({}, 'user123', 'recruiter'))
        .rejects.toThrow('Database error');
    });

    it('should handle service errors in XLSX export', async () => {
      // Arrange
      candidatesService.findAll.mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(service.exportCandidatesXLSX({}, 'user123', 'admin'))
        .rejects.toThrow('Connection failed');
    });
  });
});