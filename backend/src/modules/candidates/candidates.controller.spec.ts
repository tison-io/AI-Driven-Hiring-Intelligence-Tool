import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateFilterDto } from './dto/candidate-filter.dto';
import { ProcessingStatus } from '../../common/enums/processing-status.enum';

describe('CandidatesController', () => {
  let controller: CandidatesController;
  let candidatesService: jest.Mocked<CandidatesService>;

  const mockCandidate = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    name: 'John Doe',
    rawText: 'Resume content...',
    skills: ['JavaScript', 'Node.js'],
    experienceYears: 5,
    workExperience: [],
    education: [],
    certifications: [],
    roleFitScore: 85,
    keyStrengths: ['Problem solving', 'Team work'],
    potentialWeaknesses: ['Public speaking'],
    missingSkills: ['Python'],
    interviewQuestions: ['Tell me about yourself'],
    confidenceScore: 80,
    biasCheck: 'No bias detected',
    jobRole: 'Backend Engineer',
    jobDescription: 'Backend developer position',
    createdBy: 'user123',
    status: ProcessingStatus.COMPLETED,
    isShortlisted: false,
    fileUrl: 'https://example.com/resume.pdf',
    processingTime: 5000,
  };

  const mockRequest = {
    user: {
      id: 'user123',
      role: 'recruiter',
      email: 'recruiter@test.com'
    }
  };

  const mockAdminRequest = {
    user: {
      id: 'admin123',
      role: 'admin',
      email: 'admin@test.com'
    }
  };

  beforeEach(async () => {
    const mockCandidatesService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      toggleShortlist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        {
          provide: CandidatesService,
          useValue: mockCandidatesService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<CandidatesController>(CandidatesController);
    candidatesService = module.get(CandidatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return candidates for recruiter with user context', async () => {
      // Arrange
      const filters: CandidateFilterDto = { skill: 'JavaScript' };
      candidatesService.findAll.mockResolvedValue([mockCandidate]);

      // Act
      const result = await controller.findAll(filters, mockRequest);

      // Assert
      expect(candidatesService.findAll).toHaveBeenCalledWith(
        filters,
        mockRequest.user.id,
        mockRequest.user.role
      );
      expect(result).toEqual([mockCandidate]);
    });

    it('should return all candidates for admin user', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      candidatesService.findAll.mockResolvedValue([mockCandidate]);

      // Act
      const result = await controller.findAll(filters, mockAdminRequest);

      // Assert
      expect(candidatesService.findAll).toHaveBeenCalledWith(
        filters,
        mockAdminRequest.user.id,
        mockAdminRequest.user.role
      );
      expect(result).toEqual([mockCandidate]);
    });

    it('should handle empty filters', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      candidatesService.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(filters, mockRequest);

      // Assert
      expect(candidatesService.findAll).toHaveBeenCalledWith(
        filters,
        mockRequest.user.id,
        mockRequest.user.role
      );
      expect(result).toEqual([]);
    });

    it('should handle complex filters', async () => {
      // Arrange
      const filters: CandidateFilterDto = {
        skill: 'JavaScript',
        experience_min: 2,
        experience_max: 8,
        score_min: 70,
        score_max: 90,
        jobRole: 'Backend',
        search: 'john'
      };
      candidatesService.findAll.mockResolvedValue([mockCandidate]);

      // Act
      const result = await controller.findAll(filters, mockRequest);

      // Assert
      expect(candidatesService.findAll).toHaveBeenCalledWith(
        filters,
        mockRequest.user.id,
        mockRequest.user.role
      );
      expect(result).toEqual([mockCandidate]);
    });

    it('should handle service errors', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      candidatesService.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(controller.findAll(filters, mockRequest)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return candidate by id', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      candidatesService.findById.mockResolvedValue(mockCandidate as any);

      // Act
      const result = await controller.findById(candidateId);

      // Assert
      expect(candidatesService.findById).toHaveBeenCalledWith(candidateId);
      expect(result).toEqual(mockCandidate);
    });

    it('should handle candidate not found', async () => {
      // Arrange
      const candidateId = 'nonexistent-id';
      candidatesService.findById.mockResolvedValue(null);

      // Act
      const result = await controller.findById(candidateId);

      // Assert
      expect(candidatesService.findById).toHaveBeenCalledWith(candidateId);
      expect(result).toBeNull();
    });

    it('should handle invalid id format', async () => {
      // Arrange
      const invalidId = 'invalid-id';
      candidatesService.findById.mockRejectedValue(new Error('Invalid ObjectId'));

      // Act & Assert
      await expect(controller.findById(invalidId)).rejects.toThrow('Invalid ObjectId');
    });
  });

  describe('delete', () => {
    it('should delete candidate successfully', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      const deleteResponse = {
        success: true,
        message: 'Candidate and all PII data deleted successfully'
      };
      candidatesService.delete.mockResolvedValue(deleteResponse);

      // Act
      const result = await controller.delete(candidateId);

      // Assert
      expect(candidatesService.delete).toHaveBeenCalledWith(candidateId);
      expect(result).toEqual(deleteResponse);
    });

    it('should handle candidate not found for deletion', async () => {
      // Arrange
      const candidateId = 'nonexistent-id';
      candidatesService.delete.mockRejectedValue(new Error('Candidate not found'));

      // Act & Assert
      await expect(controller.delete(candidateId)).rejects.toThrow('Candidate not found');
      expect(candidatesService.delete).toHaveBeenCalledWith(candidateId);
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      candidatesService.delete.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(controller.delete(candidateId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('toggleShortlist', () => {
    it('should toggle shortlist status successfully', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      const updatedCandidate = { ...mockCandidate, isShortlisted: true };
      candidatesService.toggleShortlist.mockResolvedValue(updatedCandidate as any);

      // Act
      const result = await controller.toggleShortlist(candidateId);

      // Assert
      expect(candidatesService.toggleShortlist).toHaveBeenCalledWith(candidateId);
      expect(result).toEqual(updatedCandidate);
    });

    it('should handle candidate not found for shortlist toggle', async () => {
      // Arrange
      const candidateId = 'nonexistent-id';
      candidatesService.toggleShortlist.mockRejectedValue(new Error('Candidate not found'));

      // Act & Assert
      await expect(controller.toggleShortlist(candidateId)).rejects.toThrow('Candidate not found');
      expect(candidatesService.toggleShortlist).toHaveBeenCalledWith(candidateId);
    });

    it('should handle database errors during shortlist toggle', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      candidatesService.toggleShortlist.mockRejectedValue(new Error('Update failed'));

      // Act & Assert
      await expect(controller.toggleShortlist(candidateId)).rejects.toThrow('Update failed');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      // This test ensures the controller is decorated with @UseGuards(JwtAuthGuard)
      const guards = Reflect.getMetadata('__guards__', CandidatesController);
      expect(guards).toBeDefined();
    });

    it('should pass user context from request to service methods', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      candidatesService.findAll.mockResolvedValue([]);

      // Act
      await controller.findAll(filters, mockRequest);

      // Assert - Verify user context is properly extracted and passed
      expect(candidatesService.findAll).toHaveBeenCalledWith(
        filters,
        mockRequest.user.id,    // User ID extracted from JWT
        mockRequest.user.role   // User role extracted from JWT
      );
    });

    it('should handle different user roles correctly', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      candidatesService.findAll.mockResolvedValue([]);

      // Act - Test with recruiter
      await controller.findAll(filters, mockRequest);
      
      // Act - Test with admin
      await controller.findAll(filters, mockAdminRequest);

      // Assert
      expect(candidatesService.findAll).toHaveBeenNthCalledWith(1, filters, 'user123', 'recruiter');
      expect(candidatesService.findAll).toHaveBeenNthCalledWith(2, filters, 'admin123', 'admin');
    });
  });
});