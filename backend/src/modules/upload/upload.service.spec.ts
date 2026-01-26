import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UploadService } from './upload.service';
import { CandidatesService } from '../candidates/candidates.service';
import { QueueService } from '../queue/queue.service';
import { ApifyService } from '../linkedin-scraper/linkedinScraper.service';
import { LinkedInMapper } from '../linkedin-scraper/mappers/linkedin-mapper';
import { CloudinaryService } from './cloudinary.service';
import {
  ProfileNotFoundException,
  InvalidLinkedInUrlException,
} from '../linkedin-scraper/exceptions/linkedin-scraper.exceptions';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

// Mock the external libraries
jest.mock('pdf-parse');
jest.mock('mammoth');

describe('UploadService', () => {
  let service: UploadService;
  let candidatesService: jest.Mocked<CandidatesService>;
  let queueService: jest.Mocked<QueueService>;
  let apifyService: jest.Mocked<ApifyService>;
  let linkedInMapper: jest.Mocked<LinkedInMapper>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockCandidate = {
    _id: 'candidate-id-123',
    name: 'John Doe',
    rawText: 'Resume content',
    jobRole: 'Backend Engineer',
    status: 'pending',
  };

  const mockLinkedInProfile = {
    fullName: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    headline: 'Software Engineer',
    location: 'San Francisco, CA',
    experiences: [
      {
        title: 'Senior Developer',
        company: 'Tech Corp',
        startDate: '2020-01',
        endDate: '2023-12',
        description: 'Led development team',
      },
    ],
    educations: [
      {
        schoolName: 'University of Tech',
        degree: 'Computer Science',
        fieldOfStudy: 'Software Engineering',
      },
    ],
    skills: [{ name: 'JavaScript' }, { name: 'TypeScript' }],
  };

  const mockPdfFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('PDF content'),
    size: 1024,
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock pdf-parse
    (pdfParse as jest.MockedFunction<typeof pdfParse>).mockResolvedValue({
      text: 'Extracted PDF text content',
      numpages: 1,
      numrender: 1,
      info: {},
      metadata: {},
      version: '1.0'
    });
    
    // Mock mammoth
    (mammoth.extractRawText as jest.MockedFunction<typeof mammoth.extractRawText>).mockResolvedValue({
      value: 'Extracted Word document content',
      messages: []
    });

    const mockCandidatesService = {
      create: jest.fn(),
    };

    const mockQueueService = {
      addAIProcessingJob: jest.fn(),
    };

    const mockApifyService = {
      scrapeLinkedInProfiles: jest.fn(),
    };

    const mockLinkedInMapper = {
      transformMultipleProfiles: jest.fn(),
    };

    const mockCloudinaryService = {
      uploadFile: jest.fn().mockResolvedValue('https://cloudinary.com/file-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: CandidatesService,
          useValue: mockCandidatesService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: ApifyService,
          useValue: mockApifyService,
        },
        {
          provide: LinkedInMapper,
          useValue: mockLinkedInMapper,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    candidatesService = module.get(CandidatesService);
    queueService = module.get(QueueService);
    apifyService = module.get(ApifyService);
    linkedInMapper = module.get(LinkedInMapper);
    cloudinaryService = module.get(CloudinaryService);
  });

  describe('processResume', () => {
    const mockWordFile: Express.Multer.File = {
      ...mockPdfFile,
      originalname: 'resume.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    beforeEach(() => {
      candidatesService.create.mockResolvedValue(mockCandidate as any);
      queueService.addAIProcessingJob.mockResolvedValue(undefined);
    });

    it('should process PDF resume successfully', async () => {
      const result = await service.processResume(mockPdfFile, 'Backend Engineer', 'test-user-id');

      expect(pdfParse).toHaveBeenCalledWith(mockPdfFile.buffer);
      expect(candidatesService.create).toHaveBeenCalledWith({
        name: 'Extracted from Resume',
        rawText: 'Extracted PDF text content',
        jobRole: 'Backend Engineer',
        fileUrl: expect.any(String),
        source: 'file',
        status: 'pending',
        createdBy: 'test-user-id',
      });

      expect(queueService.addAIProcessingJob).toHaveBeenCalledWith(
        'candidate-id-123',
        'Backend Engineer',
        undefined
      );

      expect(result).toEqual({
        candidateId: 'candidate-id-123',
        message: 'Resume uploaded successfully. Processing started.',
        status: 'pending',
      });
    });

    it('should process Word document successfully', async () => {
      const result = await service.processResume(mockWordFile, 'Frontend Engineer', 'test-user-id');

      expect(mammoth.extractRawText).toHaveBeenCalledWith({
        buffer: mockWordFile.buffer,
      });
      expect(candidatesService.create).toHaveBeenCalledWith({
        name: 'Extracted from Resume',
        rawText: 'Extracted Word document content',
        jobRole: 'Frontend Engineer',
        fileUrl: expect.any(String),
        source: 'file',
        status: 'pending',
        createdBy: 'test-user-id',
      });

      expect(result.status).toBe('pending');
    });

    it('should throw error for unsupported file type', async () => {
      const unsupportedFile = {
        ...mockPdfFile,
        mimetype: 'text/plain',
      };

      await expect(
        service.processResume(unsupportedFile, 'Backend Engineer', 'test-user-id')
      ).rejects.toThrow('Unsupported file type');
    });

    it('should handle candidate creation failure', async () => {
      candidatesService.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.processResume(mockPdfFile, 'Backend Engineer', 'test-user-id')
      ).rejects.toThrow('Database error');
    });

    it('should handle PDF parsing failure', async () => {
      (pdfParse as jest.MockedFunction<typeof pdfParse>).mockRejectedValue(
        new Error('Invalid PDF structure')
      );

      await expect(
        service.processResume(mockPdfFile, 'Backend Engineer', 'test-user-id')
      ).rejects.toThrow('Invalid PDF structure');
    });

    it('should handle Word document parsing failure', async () => {
      (mammoth.extractRawText as jest.MockedFunction<typeof mammoth.extractRawText>).mockRejectedValue(
        new Error('Invalid Word document')
      );

      await expect(
        service.processResume(mockWordFile, 'Frontend Engineer', 'test-user-id')
      ).rejects.toThrow('Invalid Word document');
    });
  });

  describe('processLinkedinProfile', () => {
    const linkedinUrl = 'https://www.linkedin.com/in/johndoe';
    const jobRole = 'Backend Engineer';

    beforeEach(() => {
      apifyService.scrapeLinkedInProfiles.mockResolvedValue([mockLinkedInProfile as any]);
      linkedInMapper.transformMultipleProfiles.mockResolvedValue([mockLinkedInProfile]);
      candidatesService.create.mockResolvedValue(mockCandidate as any);
      queueService.addAIProcessingJob.mockResolvedValue(undefined);
    });

    it('should process LinkedIn profile successfully', async () => {
      const result = await service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id');

      expect(apifyService.scrapeLinkedInProfiles).toHaveBeenCalledWith([linkedinUrl]);
      expect(linkedInMapper.transformMultipleProfiles).toHaveBeenCalledWith([mockLinkedInProfile]);
      
      expect(candidatesService.create).toHaveBeenCalledWith({
        name: 'John Doe',
        linkedinUrl,
        rawText: expect.stringContaining('Name: John Doe'),
        jobRole,
        source: 'linkedin',
        status: 'pending',
        createdBy: 'test-user-id',
      });

      expect(queueService.addAIProcessingJob).toHaveBeenCalledWith(
        'candidate-id-123',
        jobRole,
        undefined
      );

      expect(result).toEqual({
        candidateId: 'candidate-id-123',
        message: 'LinkedIn profile processed successfully. AI analysis started.',
        status: 'pending',
      });
    });

    it('should handle scraping failure', async () => {
      apifyService.scrapeLinkedInProfiles.mockResolvedValue([]);

      await expect(
        service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id')
      ).rejects.toBeInstanceOf(HttpException);
      
      try {
        await service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id');
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Failed to scrape LinkedIn profile',
          status: HttpStatus.BAD_REQUEST,
        });
      }
    });

    it('should handle transformation failure', async () => {
      linkedInMapper.transformMultipleProfiles.mockResolvedValue([]);

      await expect(
        service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id')
      ).rejects.toBeInstanceOf(HttpException);
      
      try {
        await service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id');
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Failed to process LinkedIn profile data',
          status: HttpStatus.BAD_REQUEST,
        });
      }
    });

    it('should handle invalid LinkedIn URL', async () => {
      const invalidUrl = 'https://facebook.com/johndoe';
      apifyService.scrapeLinkedInProfiles.mockRejectedValue(
        new InvalidLinkedInUrlException(invalidUrl)
      );

      await expect(
        service.processLinkedinProfile(invalidUrl, jobRole, 'test-user-id')
      ).rejects.toThrow(InvalidLinkedInUrlException);
    });

    it('should handle profile not found', async () => {
      apifyService.scrapeLinkedInProfiles.mockRejectedValue(
        new ProfileNotFoundException(linkedinUrl)
      );

      await expect(
        service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id')
      ).rejects.toThrow(ProfileNotFoundException);
    });

    it('should handle unexpected errors', async () => {
      apifyService.scrapeLinkedInProfiles.mockRejectedValue(
        new Error('Unexpected error')
      );

      await expect(
        service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id')
      ).rejects.toBeInstanceOf(HttpException);
      
      try {
        await service.processLinkedinProfile(linkedinUrl, jobRole, 'test-user-id');
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Failed to process LinkedIn profile',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
    });
  });

  describe('LinkedIn data formatting', () => {
    it('should format complete LinkedIn profile data', async () => {
      apifyService.scrapeLinkedInProfiles.mockResolvedValue([mockLinkedInProfile as any]);
      linkedInMapper.transformMultipleProfiles.mockResolvedValue([mockLinkedInProfile]);
      candidatesService.create.mockResolvedValue(mockCandidate as any);

      await service.processLinkedinProfile(
        'https://www.linkedin.com/in/johndoe',
        'Backend Engineer',
        'test-user-id'
      );

      const createCall = candidatesService.create.mock.calls[0][0];
      const rawText = createCall.rawText;

      expect(rawText).toContain('Name: John Doe');
      expect(rawText).toContain('Headline: Software Engineer');
      expect(rawText).toContain('Location: San Francisco, CA');
      expect(rawText).toContain('Experience:');
      expect(rawText).toContain('- Senior Developer at Tech Corp');
      expect(rawText).toContain('Education:');
      expect(rawText).toContain('- University of Tech');
      expect(rawText).toContain('Skills:');
      expect(rawText).toContain('JavaScript, TypeScript');
    });

    it('should format minimal LinkedIn profile data', async () => {
      const minimalProfile = {
        fullName: 'Jane Smith',
        experiences: [],
        educations: [],
        skills: [],
      };

      apifyService.scrapeLinkedInProfiles.mockResolvedValue([minimalProfile as any]);
      linkedInMapper.transformMultipleProfiles.mockResolvedValue([minimalProfile]);
      candidatesService.create.mockResolvedValue(mockCandidate as any);

      await service.processLinkedinProfile(
        'https://www.linkedin.com/in/janesmith',
        'Frontend Engineer',
        'test-user-id'
      );

      const createCall = candidatesService.create.mock.calls[0][0];
      const rawText = createCall.rawText;

      expect(rawText).toContain('Name: Jane Smith');
      expect(rawText).not.toContain('Experience:');
      expect(rawText).not.toContain('Education:');
      expect(rawText).not.toContain('Skills:');
    });
  });

  describe('Integration workflow', () => {
    it('should complete full upload workflow for resume', async () => {
      candidatesService.create.mockResolvedValue(mockCandidate as any);
      queueService.addAIProcessingJob.mockResolvedValue(undefined);
      
      const result = await service.processResume(mockPdfFile, 'Data Scientist', 'test-user-id');

      // Verify the complete workflow
      expect(pdfParse).toHaveBeenCalledTimes(1);
      expect(candidatesService.create).toHaveBeenCalledTimes(1);
      expect(queueService.addAIProcessingJob).toHaveBeenCalledTimes(1);
      expect(result.candidateId).toBe('candidate-id-123');
      expect(result.status).toBe('pending');
    });

    it('should complete full upload workflow for LinkedIn profile', async () => {
      apifyService.scrapeLinkedInProfiles.mockResolvedValue([mockLinkedInProfile as any]);
      linkedInMapper.transformMultipleProfiles.mockResolvedValue([mockLinkedInProfile]);
      candidatesService.create.mockResolvedValue(mockCandidate as any);
      queueService.addAIProcessingJob.mockResolvedValue(undefined);

      const result = await service.processLinkedinProfile(
        'https://www.linkedin.com/in/johndoe',
        'Full Stack Engineer',
        'test-user-id'
      );

      // Verify the complete workflow
      expect(apifyService.scrapeLinkedInProfiles).toHaveBeenCalledTimes(1);
      expect(linkedInMapper.transformMultipleProfiles).toHaveBeenCalledTimes(1);
      expect(candidatesService.create).toHaveBeenCalledTimes(1);
      expect(queueService.addAIProcessingJob).toHaveBeenCalledTimes(1);
      expect(result.candidateId).toBe('candidate-id-123');
      expect(result.status).toBe('pending');
    });
  });
});