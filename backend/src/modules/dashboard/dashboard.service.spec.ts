import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { Candidate } from '../candidates/entities/candidate.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let mockCandidateModel: any;

  const mockCandidates = [
    {
      _id: '1',
      name: 'John Doe',
      jobRole: 'Backend Engineer',
      roleFitScore: 85,
      status: 'completed',
      createdBy: 'user123',
      createdAt: new Date('2024-01-15'),
    },
    {
      _id: '2',
      name: 'Jane Smith',
      jobRole: 'Frontend Developer',
      roleFitScore: 75,
      status: 'completed',
      createdBy: 'user123',
      createdAt: new Date('2024-01-10'),
    },
    {
      _id: '3',
      name: 'Bob Wilson',
      jobRole: 'DevOps Engineer',
      roleFitScore: 90,
      status: 'pending',
      createdBy: 'user456',
      createdAt: new Date('2024-01-20'),
    },
  ];

  beforeEach(async () => {
    mockCandidateModel = {
      countDocuments: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getModelToken(Candidate.name),
          useValue: mockCandidateModel,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return metrics for recruiter user', async () => {
      // Arrange
      const userId = 'user123';
      const userRole = 'recruiter';

      // Create a chainable query mock that can be reused
      const createMockQuery = (resolveValue: any) => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(resolveValue),
        exec: jest.fn().mockResolvedValue(resolveValue),
      });

      mockCandidateModel.countDocuments
        .mockResolvedValueOnce(2) // totalCandidates
        .mockResolvedValueOnce(1) // shortlistCount
        .mockResolvedValueOnce(0) // processingCount
        .mockResolvedValueOnce(0) // highQualityRate - highQuality
        .mockResolvedValueOnce(2) // highQualityRate - totalCompleted
        .mockResolvedValueOnce(0) // biasAlerts
        .mockResolvedValue(0); // any additional calls

      mockCandidateModel.find
        .mockReturnValueOnce([mockCandidates[0], mockCandidates[1]]) // completedCandidates (for avg score)
        .mockReturnValueOnce(createMockQuery([mockCandidates[0], mockCandidates[1]])) // recentCandidates
        .mockReturnValueOnce(createMockQuery([mockCandidates[0]])) // shortlistedCandidates
        .mockReturnValue(createMockQuery([])); // any additional calls (confidence, processingTime, etc.)

      // Act
      const result = await service.getDashboardMetrics(userId, userRole);

      // Assert
      expect(result.totalCandidates).toBe(2);
      expect(result.averageRoleFitScore).toBe(80); // (85 + 75) / 2
      expect(result.shortlistCount).toBe(1);
      expect(result.processingCount).toBe(0);
      expect(result.recentCandidates).toHaveLength(2);

      // Verify recruiter query includes createdBy filter
      expect(mockCandidateModel.countDocuments).toHaveBeenCalledWith({ createdBy: userId });
    });

    it('should return metrics for admin user', async () => {
      // Arrange
      const userId = 'admin123';
      const userRole = 'admin';

      const createMockQuery = (resolveValue: any) => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(resolveValue),
        exec: jest.fn().mockResolvedValue(resolveValue),
      });

      mockCandidateModel.countDocuments
        .mockResolvedValueOnce(3) // totalCandidates
        .mockResolvedValueOnce(2) // shortlistCount
        .mockResolvedValueOnce(1) // processingCount
        .mockResolvedValue(0); // any additional calls

      mockCandidateModel.find
        .mockReturnValueOnce(mockCandidates) // completedCandidates (for avg score)
        .mockReturnValueOnce(createMockQuery(mockCandidates)) // recentCandidates
        .mockReturnValueOnce(createMockQuery([mockCandidates[0], mockCandidates[2]])) // shortlistedCandidates
        .mockReturnValue(createMockQuery([])); // any additional calls

      // Act
      const result = await service.getDashboardMetrics(userId, userRole);

      // Assert
      expect(result.totalCandidates).toBe(3);
      expect(result.averageRoleFitScore).toBe(83.33); // (85 + 75 + 90) / 3
      expect(result.shortlistCount).toBe(2);
      expect(result.processingCount).toBe(1);

      // Verify admin query has no createdBy filter
      expect(mockCandidateModel.countDocuments).toHaveBeenCalledWith({});
    });

    it('should handle zero candidates', async () => {
      // Arrange
      const userId = 'user123';
      const userRole = 'recruiter';

      const createMockQuery = (resolveValue: any) => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(resolveValue),
        exec: jest.fn().mockResolvedValue(resolveValue),
      });

      mockCandidateModel.countDocuments.mockResolvedValue(0);

      mockCandidateModel.find
        .mockReturnValueOnce([]) // completedCandidates (for avg score)
        .mockReturnValue(createMockQuery([])); // any additional calls

      // Act
      const result = await service.getDashboardMetrics(userId, userRole);

      // Assert
      expect(result.totalCandidates).toBe(0);
      expect(result.averageRoleFitScore).toBe(0);
      expect(result.shortlistCount).toBe(0);
      expect(result.processingCount).toBe(0);
      expect(result.recentCandidates).toEqual([]);
    });
  });

  describe('getScoreDistribution', () => {
    it('should calculate score distribution correctly', async () => {
      // Arrange
      const candidatesWithScores = [
        { roleFitScore: 15 },  // 0-20
        { roleFitScore: 35 },  // 21-40
        { roleFitScore: 55 },  // 41-60
        { roleFitScore: 75 },  // 61-80
        { roleFitScore: 95 },  // 81-100
        { roleFitScore: 85 },  // 81-100
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue(candidatesWithScores),
      };

      mockCandidateModel.find.mockReturnValue(mockQuery);

      // Act
      const result = await service.getScoreDistribution();

      // Assert
      expect(result).toEqual({
        '0-20': 1,
        '21-40': 1,
        '41-60': 1,
        '61-80': 1,
        '81-100': 2,
      });
    });

    it('should handle empty score data', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockResolvedValue([]),
      };

      mockCandidateModel.find.mockReturnValue(mockQuery);

      // Act
      const result = await service.getScoreDistribution();

      // Assert
      expect(result).toEqual({
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0,
      });
    });
  });

  describe('getSystemHealthMetrics', () => {
    it('should calculate system health metrics', async () => {
      // Arrange
      const completedCandidates = [
        { processingTime: 1000 },
        { processingTime: 2000 },
        { processingTime: 1500 },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnValue(completedCandidates),
      };

      mockCandidateModel.find.mockReturnValue(mockQuery);
      mockCandidateModel.countDocuments
        .mockResolvedValueOnce(2) // failedCount24h
        .mockResolvedValueOnce(8); // completedCount24h

      // Act
      const result = await service.getSystemHealthMetrics();

      // Assert
      expect(result.averageProcessingTime).toBe(1500); // (1000 + 2000 + 1500) / 3
      expect(result.successRate).toBe(80); // 8 / (8 + 2) * 100
      expect(result.failedProcessingCount).toBe(2);
    });

    it('should handle zero processing data', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockResolvedValue([]),
      };

      mockCandidateModel.find.mockReturnValue(mockQuery);
      mockCandidateModel.countDocuments
        .mockResolvedValueOnce(0) // failedCount
        .mockResolvedValueOnce(0); // totalProcessed

      // Act
      const result = await service.getSystemHealthMetrics();

      // Assert
      expect(result.averageProcessingTime).toBe(0);
      expect(result.successRate).toBe(100);
      expect(result.failedProcessingCount).toBe(0);
    });
  });
});