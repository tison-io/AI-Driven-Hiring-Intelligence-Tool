import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    _id: '64f8a1b2c3d4e5f6789012ab',
    email: 'test@example.com',
    role: UserRole.RECRUITER,
  };

  const mockAuthResponse = {
    user: mockUser,
    access_token: 'mock-jwt-token',
  };

  // Mock Response helper
  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      changePassword: jest.fn(),
    };

    const mockCloudinaryService = {
      uploadImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), verify: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
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
      authService.register.mockResolvedValue(mockAuthResponse as any);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toHaveProperty('user');
    });

    it('should handle registration errors', async () => {
      // Arrange
      authService.register.mockRejectedValue(
        new UnauthorizedException('User with this email already exists'),
      );

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(
        new UnauthorizedException('User with this email already exists'),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    it('should successfully login user', async () => {
      // Arrange
      authService.login.mockResolvedValue(mockAuthResponse as any);

      // Act
      const result = await controller.login(loginDto, mockResponse());

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toHaveProperty('user');
    });

    it('should handle login errors', async () => {
      // Arrange
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      // Act & Assert
      await expect(controller.login(loginDto, mockResponse())).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('getProfile', () => {
    const mockRequest = {
      user: { id: '64f8a1b2c3d4e5f6789012ab' },
    };

    it('should successfully get user profile', async () => {
      // Arrange
      authService.getProfile.mockResolvedValue(mockUser as any);

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(authService.getProfile).toHaveBeenCalledWith(mockRequest.user.id);
      expect(result).toEqual(mockUser);
    });

    it('should handle profile retrieval errors', async () => {
      // Arrange
      authService.getProfile.mockRejectedValue(
        new UnauthorizedException('User not found'),
      );

      // Act & Assert
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        new UnauthorizedException('User not found'),
      );
    });
  });

  describe('changePassword', () => {
    const mockRequest = {
      user: { id: '64f8a1b2c3d4e5f6789012ab' },
    };

    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass456@',
    };

    it('should successfully change password', async () => {
      // Arrange
      const mockResponse = { message: 'Password changed successfully' };
      authService.changePassword.mockResolvedValue(mockResponse as any);

      // Act
      const result = await controller.changePassword(mockRequest, changePasswordDto);

      // Assert
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockRequest.user.id,
        changePasswordDto,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle password change errors', async () => {
      // Arrange
      authService.changePassword.mockRejectedValue(
        new UnauthorizedException('Current password is incorrect'),
      );

      // Act & Assert
      await expect(
        controller.changePassword(mockRequest, changePasswordDto),
      ).rejects.toThrow(new UnauthorizedException('Current password is incorrect'));
    });
  });
});