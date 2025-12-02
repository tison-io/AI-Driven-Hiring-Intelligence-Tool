import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UserRole } from '../../common/enums/user-role.enum';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  const mockUser = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    role: UserRole.RECRUITER,
    save: jest.fn(),
  };

  beforeEach(async () => {
    // Create a mock constructor function with proper typing
    const mockUserModelConstructor: any = jest.fn().mockImplementation((userData) => ({
      ...userData,
      save: jest.fn().mockResolvedValue({ ...userData, ...mockUser }),
    }));

    // Add static methods to the constructor
    mockUserModelConstructor.findOne = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModelConstructor.findById = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModelConstructor.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });
    mockUserModelConstructor.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModelConstructor,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockUserModel = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      role: UserRole.RECRUITER,
    };

    it('should successfully create a new user', async () => {
      // Arrange
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hashedPassword' as never);

      // Act
      const result = await service.create(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserModel).toHaveBeenCalledWith({
        email: registerDto.email,
        password: '$2b$10$hashedPassword',
        role: registerDto.role,
      });
      expect(result).toBeDefined();
    });

    it('should use default role when role is not provided', async () => {
      // Arrange
      const registerDtoWithoutRole = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hashedPassword' as never);

      // Act
      await service.create(registerDtoWithoutRole as RegisterDto);

      // Assert
      expect(mockUserModel).toHaveBeenCalledWith({
        email: registerDtoWithoutRole.email,
        password: '$2b$10$hashedPassword',
        role: undefined,
      });
    });

    it('should handle bcrypt hashing errors', async () => {
      // Arrange
      mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed') as never);

      // Act & Assert
      await expect(service.create(registerDto)).rejects.toThrow('Hashing failed');
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      // Arrange
      const execMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({ exec: execMock });

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(execMock).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const execMock = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({ exec: execMock });

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const execMock = jest.fn().mockRejectedValue(new Error('Database error'));
      mockUserModel.findOne.mockReturnValue({ exec: execMock });

      // Act & Assert
      await expect(service.findByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    const userId = '64f8a1b2c3d4e5f6789012ab';

    it('should return user when found', async () => {
      // Arrange
      const execMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findById.mockReturnValue({ exec: execMock });

      // Act
      const result = await service.findById(userId);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(execMock).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      // Arrange
      const execMock = jest.fn().mockResolvedValue(null);
      mockUserModel.findById.mockReturnValue({ exec: execMock });

      // Act
      const result = await service.findById('nonexistent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    const userId = '64f8a1b2c3d4e5f6789012ab';
    const hashedPassword = '$2b$10$newHashedPassword';

    it('should successfully update password', async () => {
      // Arrange
      const execMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      // Act
      await service.updatePassword(userId, hashedPassword);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { password: hashedPassword },
      );
      expect(execMock).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      // Arrange
      const execMock = jest.fn().mockRejectedValue(new Error('Update failed'));
      mockUserModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      // Act & Assert
      await expect(service.updatePassword(userId, hashedPassword)).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    const userId = '64f8a1b2c3d4e5f6789012ab';

    it('should successfully delete user', async () => {
      // Arrange
      const execMock = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findByIdAndDelete.mockReturnValue({ exec: execMock });

      // Act
      await service.delete(userId);

      // Assert
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(execMock).toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const execMock = jest.fn().mockRejectedValue(new Error('Deletion failed'));
      mockUserModel.findByIdAndDelete.mockReturnValue({ exec: execMock });

      // Act & Assert
      await expect(service.delete(userId)).rejects.toThrow('Deletion failed');
    });
  });
});