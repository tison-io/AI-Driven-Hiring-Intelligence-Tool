import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    const mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    };

    reflector = mockReflector as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    let mockContext: jest.Mocked<ExecutionContext>;

    beforeEach(() => {
      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;
    });

    it('should allow access to public routes', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(true);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should call parent canActivate for protected routes', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(false);
      const parentCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      parentCanActivateSpy.mockReturnValue(true);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(true);
    });

    it('should call parent canActivate when isPublic is undefined', () => {
      // Arrange
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const parentCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      parentCanActivateSpy.mockReturnValue(false);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(parentCanActivateSpy).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(false);
    });
  });
});
