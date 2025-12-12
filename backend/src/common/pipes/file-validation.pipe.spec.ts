import { BadRequestException } from '@nestjs/common';
import { FileValidationPipe } from './file-validation.pipe';

describe('FileValidationPipe', () => {
  let pipe: FileValidationPipe;

  const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test content'),
    size: 1024,
    stream: null,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  });

  beforeEach(() => {
    pipe = new FileValidationPipe();
  });

  describe('Valid files', () => {
    it('should accept PDF files', () => {
      const file = createMockFile({ mimetype: 'application/pdf' });
      
      expect(pipe.transform(file)).toBe(file);
    });

    it('should accept DOCX files', () => {
      const file = createMockFile({ 
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      expect(pipe.transform(file)).toBe(file);
    });

    it('should accept DOC files', () => {
      const file = createMockFile({ mimetype: 'application/msword' });
      
      expect(pipe.transform(file)).toBe(file);
    });

    it('should accept files under 10MB', () => {
      const file = createMockFile({ size: 5 * 1024 * 1024 }); // 5MB
      
      expect(pipe.transform(file)).toBe(file);
    });
  });

  describe('Invalid files', () => {
    it('should reject missing file', () => {
      expect(() => pipe.transform(null as any)).toThrow(
        new BadRequestException('File is required')
      );
    });

    it('should reject undefined file', () => {
      expect(() => pipe.transform(undefined as any)).toThrow(
        new BadRequestException('File is required')
      );
    });

    it('should reject invalid MIME types', () => {
      const file = createMockFile({ mimetype: 'text/plain' });
      
      expect(() => pipe.transform(file)).toThrow(
        new BadRequestException('Only PDF and DOCX files are allowed')
      );
    });

    it('should reject image files', () => {
      const file = createMockFile({ mimetype: 'image/jpeg' });
      
      expect(() => pipe.transform(file)).toThrow(
        new BadRequestException('Only PDF and DOCX files are allowed')
      );
    });

    it('should reject files over 10MB', () => {
      const file = createMockFile({ size: 11 * 1024 * 1024 }); // 11MB
      
      expect(() => pipe.transform(file)).toThrow(
        new BadRequestException('File size must be less than 10MB')
      );
    });

    it('should reject files exactly at 10MB + 1 byte', () => {
      const file = createMockFile({ size: (10 * 1024 * 1024) + 1 });
      
      expect(() => pipe.transform(file)).toThrow(
        new BadRequestException('File size must be less than 10MB')
      );
    });
  });

  describe('Edge cases', () => {
    it('should accept files exactly at 10MB', () => {
      const file = createMockFile({ size: 10 * 1024 * 1024 }); // Exactly 10MB
      
      expect(pipe.transform(file)).toBe(file);
    });

    it('should accept zero-byte files', () => {
      const file = createMockFile({ size: 0 });
      
      expect(pipe.transform(file)).toBe(file);
    });
  });
});