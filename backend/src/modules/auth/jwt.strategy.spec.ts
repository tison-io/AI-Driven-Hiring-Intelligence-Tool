import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../common/enums/user-role.enum';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    email: 'test@example.com',
    role: UserRole.RECRUITER,
  };

  const mockPayload = {
    email: 'test@example.com',
    sub: '64f8a1b2c3d4e5f6789012ab',
    role: UserRole.RECRUITER,
    iat: 1642678800,
    exp: 1643283600,
  };

  beforeEach(async () => {
    const mockUsersService = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtStrategy,
          useFactory: (usersService: UsersService) => {
            // Create strategy without calling super() in constructor
            const strategy = Object.create(JwtStrategy.prototype);
            strategy.usersService = usersService;
            return strategy;
          },
          inject: [UsersService],
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user object when user exists', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await strategy.validate(mockPayload);

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith(mockPayload.sub);
      expect(result).toEqual({
        id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(null);

      // Act
      const result = await strategy.validate(mockPayload);

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith(mockPayload.sub);
      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      usersService.findById.mockRejectedValue(new Error('Database connection error'));

      // Act & Assert
      await expect(strategy.validate(mockPayload)).rejects.toThrow('Database connection error');
      expect(usersService.findById).toHaveBeenCalledWith(mockPayload.sub);
    });

    it('should validate with different user roles', async () => {
      // Arrange
      const adminUser = { ...mockUser, role: UserRole.ADMIN };
      const adminPayload = { ...mockPayload, role: UserRole.ADMIN };
      usersService.findById.mockResolvedValue(adminUser as any);

      // Act
      const result = await strategy.validate(adminPayload);

      // Assert
      expect(result).toEqual({
        id: adminUser._id,
        email: adminUser.email,
        role: UserRole.ADMIN,
      });
    });

    it('should handle malformed payload gracefully', async () => {
      // Arrange
      const malformedPayload = {
        sub: null,
        email: 'test@example.com',
      };
      usersService.findById.mockResolvedValue(null);

      // Act
      const result = await strategy.validate(malformedPayload);

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith(null);
      expect(result).toBeNull();
    });
  });
});