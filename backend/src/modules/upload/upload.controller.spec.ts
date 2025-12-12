import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: jest.Mocked<UploadService>;

  const mockUploadService = {
    processResume: jest.fn(),
    processLinkedinProfile: jest.fn(),
  };

  const mockFile: Express.Multer.File = {
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

  const mockRequest = {
    user: { id: 'user-123' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get(UploadService);
  });

  describe('uploadResume', () => {
    const uploadResumeDto = {
      jobRole: 'Backend Engineer',
      jobDescription: 'Node.js experience required',
    };

    const mockResponse = {
      candidateId: 'candidate-123',
      message: 'Resume uploaded successfully. Processing started.',
      status: 'pending',
    };

    it('should upload resume successfully', async () => {
      uploadService.processResume.mockResolvedValue(mockResponse);

      const result = await controller.uploadResume(
        mockFile,
        uploadResumeDto,
        mockRequest,
      );

      expect(uploadService.processResume).toHaveBeenCalledWith(
        mockFile,
        'Backend Engineer',
        'user-123',
        'Node.js experience required',
      );
      expect(result).toEqual(mockResponse);
    });

    it('should upload resume without job description', async () => {
      const dtoWithoutDescription = { jobRole: 'Frontend Engineer' };
      uploadService.processResume.mockResolvedValue(mockResponse);

      await controller.uploadResume(
        mockFile,
        dtoWithoutDescription,
        mockRequest,
      );

      expect(uploadService.processResume).toHaveBeenCalledWith(
        mockFile,
        'Frontend Engineer',
        'user-123',
        undefined,
      );
    });

    it('should handle upload service errors', async () => {
      uploadService.processResume.mockRejectedValue(
        new Error('Processing failed'),
      );

      await expect(
        controller.uploadResume(mockFile, uploadResumeDto, mockRequest),
      ).rejects.toThrow('Processing failed');
    });
  });

  describe('processLinkedin', () => {
    const linkedinProfileDto = {
      linkedinUrl: 'https://www.linkedin.com/in/johndoe',
      jobRole: 'Backend Engineer',
      jobDescription: 'Node.js experience required',
    };

    const mockResponse = {
      candidateId: 'candidate-123',
      message: 'LinkedIn profile processed successfully. AI analysis started.',
      status: 'pending',
    };

    it('should process LinkedIn profile successfully', async () => {
      uploadService.processLinkedinProfile.mockResolvedValue(mockResponse);

      const result = await controller.processLinkedin(
        linkedinProfileDto,
        mockRequest,
      );

      expect(uploadService.processLinkedinProfile).toHaveBeenCalledWith(
        'https://www.linkedin.com/in/johndoe',
        'Backend Engineer',
        'user-123',
        'Node.js experience required',
      );
      expect(result).toEqual(mockResponse);
    });

    it('should process LinkedIn profile without job description', async () => {
      const dtoWithoutDescription = {
        linkedinUrl: 'https://www.linkedin.com/in/johndoe',
        jobRole: 'Frontend Engineer',
      };
      uploadService.processLinkedinProfile.mockResolvedValue(mockResponse);

      await controller.processLinkedin(dtoWithoutDescription, mockRequest);

      expect(uploadService.processLinkedinProfile).toHaveBeenCalledWith(
        'https://www.linkedin.com/in/johndoe',
        'Frontend Engineer',
        'user-123',
        undefined,
      );
    });

    it('should handle LinkedIn processing errors', async () => {
      uploadService.processLinkedinProfile.mockRejectedValue(
        new Error('LinkedIn processing failed'),
      );

      await expect(
        controller.processLinkedin(linkedinProfileDto, mockRequest),
      ).rejects.toThrow('LinkedIn processing failed');
    });
  });

  describe('User Context', () => {
    it('should extract user ID from request', async () => {
      const uploadResumeDto = { jobRole: 'Backend Engineer' };
      uploadService.processResume.mockResolvedValue({
        candidateId: 'candidate-123',
        message: 'Success',
        status: 'pending',
      });

      await controller.uploadResume(mockFile, uploadResumeDto, mockRequest);

      expect(uploadService.processResume).toHaveBeenCalledWith(
        mockFile,
        'Backend Engineer',
        'user-123',
        undefined,
      );
    });
  });
});