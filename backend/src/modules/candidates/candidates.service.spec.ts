import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CandidatesService } from './candidates.service';
import { Candidate } from './entities/candidate.entity';
import { CandidateFilterDto } from './dto/candidate-filter.dto';
import { ProcessingStatus } from '../../common/enums/processing-status.enum';

describe('CandidatesService', () => {
  let service: CandidatesService;
  let mockCandidateModel: any;

  const mockCandidate = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    name: 'John Doe',
    rawText: 'Resume content...',
    skills: ['JavaScript', 'Node.js'],
    experienceYears: 5,
    roleFitScore: 85,
    jobRole: 'Backend Engineer',
    createdBy: 'user123',
    status: ProcessingStatus.COMPLETED,
    isShortlisted: false,
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    // Mock constructor function
    mockCandidateModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...data, _id: 'new-id' }),
    }));

    // Add static methods to the constructor function
    mockCandidateModel.find = jest.fn().mockReturnThis();
    mockCandidateModel.findById = jest.fn().mockReturnThis();
    mockCandidateModel.findByIdAndUpdate = jest.fn().mockReturnThis();
    mockCandidateModel.findByIdAndDelete = jest.fn().mockReturnThis();
    mockCandidateModel.deleteMany = jest.fn().mockReturnThis();
    mockCandidateModel.exec = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        {
          provide: getModelToken(Candidate.name),
          useValue: mockCandidateModel,
        },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all candidates for admin users', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      const userId = 'admin123';
      const userRole = 'admin';
      mockCandidateModel.exec.mockResolvedValue([mockCandidate]);

      // Act
      const result = await service.findAll(filters, userId, userRole);

      // Assert
      expect(mockCandidateModel.find).toHaveBeenCalledWith({});
      expect(result).toEqual([mockCandidate]);
    });

    it('should filter candidates by createdBy for non-admin users', async () => {
      // Arrange
      const filters: CandidateFilterDto = {};
      const userId = 'recruiter123';
      const userRole = 'recruiter';
      mockCandidateModel.exec.mockResolvedValue([mockCandidate]);

      // Act
      await service.findAll(filters, userId, userRole);

      // Assert
      expect(mockCandidateModel.find).toHaveBeenCalledWith({
        createdBy: userId,
      });
    });

    it('should apply skill filter correctly', async () => {
      // Arrange
      const filters: CandidateFilterDto = { skill: 'JavaScript' };
      const userId = 'user123';
      const userRole = 'recruiter';
      mockCandidateModel.exec.mockResolvedValue([mockCandidate]);

      // Act
      await service.findAll(filters, userId, userRole);

      // Assert
      expect(mockCandidateModel.find).toHaveBeenCalledWith({
        createdBy: userId,
        skills: { $regex: 'JavaScript', $options: 'i' },
      });
    });

    it('should apply experience range filter correctly', async () => {
      // Arrange
      const filters: CandidateFilterDto = {
        experience_min: 2,
        experience_max: 8,
      };
      const userId = 'user123';
      const userRole = 'recruiter';
      mockCandidateModel.exec.mockResolvedValue([mockCandidate]);

      // Act
      await service.findAll(filters, userId, userRole);

      // Assert
      expect(mockCandidateModel.find).toHaveBeenCalledWith({
        createdBy: userId,
        experienceYears: { $gte: 2, $lte: 8 },
      });
    });

    it('should apply score range filter correctly', async () => {
      // Arrange
      const filters: CandidateFilterDto = { score_min: 70, score_max: 90 };
      const userId = 'user123';
      const userRole = 'recruiter';
      mockCandidateModel.exec.mockResolvedValue([mockCandidate]);

      // Act
      await service.findAll(filters, userId, userRole);

      // Assert
      expect(mockCandidateModel.find).toHaveBeenCalledWith({
        createdBy: userId,
        roleFitScore: { $gte: 70, $lte: 90 },
      });
    });

    it('should apply search filter across multiple fields', async () => {
      // Arrange
      const filters: CandidateFilterDto = { search: 'john' };
      const userId = 'user123';
      const userRole = 'recruiter';
      mockCandidateModel.exec.mockResolvedValue([mockCandidate]);

      // Act
      await service.findAll(filters, userId, userRole);

      // Assert
      expect(mockCandidateModel.find).toHaveBeenCalledWith({
        createdBy: userId,
        $or: [
          { name: { $regex: 'john', $options: 'i' } },
          { skills: { $regex: 'john', $options: 'i' } },
          { jobRole: { $regex: 'john', $options: 'i' } },
        ],
      });
    });
  });

  describe('create', () => {
    it('should create a new candidate successfully', async () => {
      // Arrange
      const candidateData = {
        name: 'Jane Smith',
        rawText: 'Resume content...',
        jobRole: 'Frontend Developer',
        createdBy: 'user123',
      };

      const expectedResult = { ...candidateData, _id: 'new-id' };

      // Act
      const result = await service.create(candidateData);

      // Assert
      expect(mockCandidateModel).toHaveBeenCalledWith(candidateData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('toggleShortlist', () => {
    it('should toggle shortlist status from false to true', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      const mockCandidateDoc = {
        ...mockCandidate,
        isShortlisted: false,
        save: jest
          .fn()
          .mockResolvedValue({ ...mockCandidate, isShortlisted: true }),
      };
      mockCandidateModel.exec.mockResolvedValue(mockCandidateDoc);

      // Act
      const result = await service.toggleShortlist(candidateId);

      // Assert
      expect(mockCandidateModel.findById).toHaveBeenCalledWith(candidateId);
      expect(mockCandidateDoc.isShortlisted).toBe(true);
      expect(mockCandidateDoc.save).toHaveBeenCalled();
    });

    it('should toggle shortlist status from true to false', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      const mockCandidateDoc = {
        ...mockCandidate,
        isShortlisted: true,
        save: jest
          .fn()
          .mockResolvedValue({ ...mockCandidate, isShortlisted: false }),
      };
      mockCandidateModel.exec.mockResolvedValue(mockCandidateDoc);

      // Act
      const result = await service.toggleShortlist(candidateId);

      // Assert
      expect(mockCandidateDoc.isShortlisted).toBe(false);
      expect(mockCandidateDoc.save).toHaveBeenCalled();
    });

    it('should throw error if candidate not found', async () => {
      // Arrange
      const candidateId = 'nonexistent-id';
      mockCandidateModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.toggleShortlist(candidateId)).rejects.toThrow(
        'Candidate not found',
      );
      expect(mockCandidateModel.findById).toHaveBeenCalledWith(candidateId);
    });
  });

  describe('delete', () => {
    it('should delete candidate successfully', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      mockCandidateModel.exec.mockResolvedValue(mockCandidate);

      // Act
      const result = await service.delete(candidateId);

      // Assert
      expect(mockCandidateModel.findByIdAndDelete).toHaveBeenCalledWith(
        candidateId,
      );
      expect(result).toEqual({
        success: true,
        message: 'Candidate and all PII data deleted successfully',
      });
    });

    it('should throw error if candidate not found for deletion', async () => {
      // Arrange
      const candidateId = 'nonexistent-id';
      mockCandidateModel.exec.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(candidateId)).rejects.toThrow(
        'Candidate not found',
      );
      expect(mockCandidateModel.findByIdAndDelete).toHaveBeenCalledWith(
        candidateId,
      );
    });
  });

  describe('findById', () => {
    it('should return candidate by id', async () => {
      // Arrange
      const candidateId = '64f8a1b2c3d4e5f6789012ab';
      mockCandidateModel.exec.mockResolvedValue(mockCandidate);

      // Act
      const result = await service.findById(candidateId);

      // Assert
      expect(mockCandidateModel.findById).toHaveBeenCalledWith(candidateId);
      expect(result).toEqual(mockCandidate);
    });

    it('should return null if candidate not found', async () => {
      // Arrange
      const candidateId = 'nonexistent-id';
      mockCandidateModel.exec.mockResolvedValue(null);

      // Act
      const result = await service.findById(candidateId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
