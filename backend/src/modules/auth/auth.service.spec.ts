import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/enums/user-role.enum';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock user data
  const mockUser = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    email: 'test@example.com',
    password: '$2b$10$hashedPassword',
    role: UserRole.RECRUITER,
    toObject: jest.fn().mockReturnValue({
      _id: '64f8a1b2c3d4e5f6789012ab',
      email: 'test@example.com',
      password: '$2b$10$hashedPassword',
      role: UserRole.RECRUITER,
    }),
  };

  const mockUserWithoutPassword = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    email: 'test@example.com',
    role: UserRole.RECRUITER,
  };

  beforeEach(async () => {
    // Create mocked services
    const mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
      sendPasswordResetConfirmation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        role: mockUser.role,
        profileCompleted: false,
      });
      expect(result.user).toEqual(mockUserWithoutPassword);
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException if user already exists', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new UnauthorizedException('User with this email already exists'),
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser._id,
        role: mockUser.role,
        profileCompleted: false,
      });
      expect(result.user).toEqual(mockUserWithoutPassword);
      expect(result.access_token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });

  describe('changePassword', () => {
    const userId = '64f8a1b2c3d4e5f6789012ab';
    const changePasswordDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456@',
    };

    it('should successfully change password', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$newHashedPassword' as never);

      // Act
      const result = await service.changePassword(userId, changePasswordDto);

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        10,
      );
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        userId,
        '$2b$10$newHashedPassword',
      );
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(new UnauthorizedException('User not found'));
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(mockUser as any);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(
        new UnauthorizedException('Current password is incorrect'),
      );
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    const userId = '64f8a1b2c3d4e5f6789012ab';

    it('should successfully return user profile', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.getProfile(userId);

      // Assert
      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.toObject).toHaveBeenCalled();
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      usersService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile(userId)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });
});
