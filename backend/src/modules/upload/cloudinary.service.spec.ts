import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { PassThrough } from 'stream';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService: jest.Mocked<ConfigService> = {
    get: jest.fn(),
  } as any;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('image content'),
    size: 1024,
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        CLOUDINARY_CLOUD_NAME: 'test-cloud',
        CLOUDINARY_API_KEY: 'test-key',
        CLOUDINARY_API_SECRET: 'test-secret',
      };
      return config[key];
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    configService = module.get(ConfigService);
  });

  describe('constructor', () => {
    it('should configure cloudinary with environment variables', () => {
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-key',
        api_secret: 'test-secret',
      });
    });

    it('should call config service for all required variables', () => {
      expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_CLOUD_NAME');
      expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_KEY');
      expect(configService.get).toHaveBeenCalledWith('CLOUDINARY_API_SECRET');
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.jpg',
      };

      const mockUploadStream = new PassThrough();
      const endSpy = jest.spyOn(mockUploadStream, 'end');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          // Simulate async callback
          setTimeout(() => callback(null, mockResult), 0);
          return mockUploadStream;
        },
      );

      const result = await service.uploadImage(mockFile, 'test-folder');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder',
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
        },
        expect.any(Function),
      );

      expect(endSpy).toHaveBeenCalledWith(mockFile.buffer);
      expect(result).toBe('https://cloudinary.com/image.jpg');
    });

    it('should handle upload errors', async () => {
      const mockError = new Error('Upload failed');
      const mockUploadStream = new PassThrough();
      const endSpy = jest.spyOn(mockUploadStream, 'end');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => callback(mockError, null), 0);
          return mockUploadStream;
        },
      );

      await expect(
        service.uploadImage(mockFile, 'test-folder'),
      ).rejects.toThrow('Upload failed');

      expect(endSpy).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should handle non-image file types', async () => {
      const textFile = {
        ...mockFile,
        mimetype: 'text/plain',
      };

      const mockUploadStream = new PassThrough();
      const endSpy = jest.spyOn(mockUploadStream, 'end');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => callback(new Error('Invalid file type'), null), 0);
          return mockUploadStream;
        },
      );

      await expect(
        service.uploadImage(textFile, 'test-folder'),
      ).rejects.toThrow('Invalid file type');

      expect(endSpy).toHaveBeenCalledWith(textFile.buffer);
    });

    it('should handle undefined file', async () => {
      await expect(
        service.uploadImage(undefined as any, 'test-folder'),
      ).rejects.toThrow();
    });

    it('should return empty string when no secure_url in result', async () => {
      const mockResult = {}; // No secure_url property

      const mockUploadStream = new PassThrough();
      const endSpy = jest.spyOn(mockUploadStream, 'end');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => callback(null, mockResult), 0);
          return mockUploadStream;
        },
      );

      const result = await service.uploadImage(mockFile, 'test-folder');

      expect(result).toBe('');
      expect(endSpy).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should use correct transformation parameters', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.jpg',
      };

      const mockUploadStream = new PassThrough();

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => callback(null, mockResult), 0);
          return mockUploadStream;
        },
      );

      await service.uploadImage(mockFile, 'profiles');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: 'profiles',
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
        }),
        expect.any(Function),
      );
    });

    it('should pass file buffer to upload stream', async () => {
      const mockResult = {
        secure_url: 'https://cloudinary.com/image.jpg',
      };

      const mockUploadStream = new PassThrough();
      const endSpy = jest.spyOn(mockUploadStream, 'end');

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          setTimeout(() => callback(null, mockResult), 0);
          return mockUploadStream;
        },
      );

      await service.uploadImage(mockFile, 'test-folder');

      expect(endSpy).toHaveBeenCalledWith(mockFile.buffer);
    });
  });
});
