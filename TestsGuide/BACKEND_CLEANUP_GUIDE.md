# Backend Cleanup Guide - Critical Issues & Fixes

## 🚨 **Critical Issues Found**

### **1. Inconsistent Error Handling**
```typescript
// ❌ MIXED: Some methods throw Error, others HttpException
throw new Error('Candidate not found');           // Plain Error
throw new HttpException('Failed', HttpStatus.BAD_REQUEST); // HttpException
```

### **2. Missing Input Validation**
```typescript
// ❌ CRITICAL: No validation on file uploads, LinkedIn URLs
async processLinkedinProfile(linkedinUrl: string, jobRole: string, userId: string)
// No URL format validation, no sanitization
```

### **3. Hardcoded Values & Magic Numbers**
```typescript
// ❌ SCATTERED: Magic numbers throughout codebase
timeout: 30000  // 30 seconds hardcoded
Math.floor(Math.random() * 40) + 60  // Random score generation
```

---

## 🔧 **Immediate Cleanup Tasks**

### **Priority 1: Standardize Error Handling (2 hours)**

#### **Create consistent exception types:**
```typescript
// src/common/exceptions/
export class CandidateNotFoundException extends HttpException {
  constructor(id: string) {
    super(`Candidate with ID ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidFileTypeException extends HttpException {
  constructor(allowedTypes: string[]) {
    super(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, HttpStatus.BAD_REQUEST);
  }
}
```

#### **Update all services to use HttpException:**
```typescript
// ❌ Replace all instances of:
throw new Error('Candidate not found');

// ✅ With:
throw new CandidateNotFoundException(id);
```

### **Priority 2: Add Input Validation (1-2 hours)**

#### **Create validation DTOs:**
```typescript
// src/modules/upload/dto/linkedin-upload.dto.ts
export class LinkedInUploadDto {
  @IsUrl({}, { message: 'Invalid LinkedIn URL format' })
  @Matches(/linkedin\.com\/in\//, { message: 'Must be a LinkedIn profile URL' })
  linkedinUrl: string;

  @IsString()
  @IsNotEmpty()
  jobRole: string;
}
```

#### **Add file validation:**
```typescript
// src/common/pipes/file-validation.pipe.ts
export class FileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException(allowedTypes);
    }

    if (file.size > maxSize) {
      throw new HttpException('File too large', HttpStatus.BAD_REQUEST);
    }

    return file;
  }
}
```

### **Priority 3: Extract Constants (30 minutes)**

#### **Create constants file:**
```typescript
// src/utils/constants.ts
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  TIMEOUT: 30000
} as const;

export const AI_SERVICE = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  FALLBACK_ENABLED: true
} as const;

export const SCORE_RANGES = {
  MIN: 0,
  MAX: 100,
  MOCK_MIN: 60,
  MOCK_RANGE: 40
} as const;
```

### **Priority 4: Add Security Measures (1 hour)**

#### **Add rate limiting and request validation:**
```typescript
// src/modules/upload/upload.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 uploads per minute
@Post('resume')
async uploadResume() {
  // ...
}
```

---

## 🧹 **Code Quality Cleanup**

### **1. Remove Dead Code & TODOs**
```bash
# Search for and remove:
- Commented out code blocks
- TODO comments without implementation
- Unused imports
- Empty catch blocks: .catch(() => {})
```

### **2. Standardize Logging**
```typescript
// ❌ Inconsistent logging patterns
console.log('Debug info');
this.logger.log('Info message');
this.logger.error('Error', error.stack);

// ✅ Use structured logging
this.logger.log('AI evaluation started', { candidateId, jobRole });
this.logger.error('AI evaluation failed', { candidateId, error: error.message, stack: error.stack });
```

### **3. Fix Type Safety Issues**
```typescript
// ❌ Using 'any' types
private formatLinkedInData(profile: any): string

// ✅ Create proper interfaces
interface LinkedInProfile {
  fullName: string;
  headline?: string;
  location?: string;
  experiences?: Experience[];
  educations?: Education[];
  skills?: Skill[];
}
```

### **4. Improve Database Queries**
```typescript
// ❌ Inefficient queries
return this.candidateModel.find(query).exec();

// ✅ Add pagination and indexing
return this.candidateModel
  .find(query)
  .limit(filters.limit || 20)
  .skip((filters.page - 1) * (filters.limit || 20))
  .sort({ createdAt: -1 })
  .exec();
```

---

## 🔒 **Security & Performance Issues**

### **1. Add Rate Limiting**
```typescript
// src/modules/upload/upload.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 uploads per minute
@Post('resume')
async uploadResume() {
  // ...
}
```

### **2. Sanitize Inputs**
```typescript
// ❌ Direct string interpolation
`Name: ${profile.fullName}`

// ✅ Sanitize user inputs
import { escape } from 'html-escaper';
`Name: ${escape(profile.fullName)}`
```

### **3. Add Request Timeouts**
```typescript
// ❌ No timeout handling
const response = await axios.post(url, data);

// ✅ Add proper timeouts
const response = await axios.post(url, data, {
  timeout: AI_SERVICE.TIMEOUT,
  signal: AbortSignal.timeout(AI_SERVICE.TIMEOUT)
});
```

### **4. Secure File Processing**
```typescript
// ❌ No file content validation
const data = await pdfParse(file.buffer);

// ✅ Add file content validation
if (file.buffer.length === 0) {
  throw new HttpException('Empty file', HttpStatus.BAD_REQUEST);
}

// Scan for malicious content
const data = await pdfParse(file.buffer);
if (!data.text || data.text.trim().length === 0) {
  throw new HttpException('No readable content found', HttpStatus.BAD_REQUEST);
}
```

---

## 📁 **Architecture Improvements**

### **1. Separate Concerns**
```bash
# Current structure issues:
- AI service handles both extraction and scoring
- Upload service does too many things
- Mixed business logic in controllers

# Recommended structure:
src/modules/
├── ai/
│   ├── extraction/     # Text extraction logic
│   ├── scoring/        # Candidate scoring logic
│   └── fallback/       # Mock/fallback responses
├── file-processing/    # File handling only
├── linkedin/           # LinkedIn-specific logic
└── candidates/         # Pure CRUD operations
```

### **2. Add Service Interfaces**
```typescript
// src/modules/ai/interfaces/ai-service.interface.ts
export interface IAIService {
  evaluateCandidate(rawText: string, jobRole: string): Promise<CandidateEvaluation>;
  extractSkills(rawText: string): Promise<string[]>;
}

// Allows easy swapping between real AI and mock implementations
```

### **3. Implement Repository Pattern**
```typescript
// src/modules/candidates/repositories/candidate.repository.ts
export interface ICandidateRepository {
  findAll(filters: CandidateFilterDto): Promise<Candidate[]>;
  findById(id: string): Promise<Candidate | null>;
  create(data: CreateCandidateDto): Promise<Candidate>;
  update(id: string, data: UpdateCandidateDto): Promise<Candidate>;
  delete(id: string): Promise<void>;
}
```

---

## 🚀 **Quick Wins (30 minutes each)**

### **1. Fix TypeScript Strict Mode**
```bash
# Enable strict mode in tsconfig.json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true
```

### **2. Add Health Check Endpoint**
```typescript
// src/modules/health/health.controller.ts
@Get('health')
async getHealth() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      ai: await this.checkAIService()
    }
  };
}
```

### **3. Standardize API Responses**
```typescript
// src/common/interfaces/api-response.interface.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}
```

### **4. Add Request/Response Logging**
```typescript
// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`${request.method} ${request.url} - ${duration}ms`);
      })
    );
  }
}
```

---

## 📋 **Cleanup Checklist**

### **Phase 1: Critical Fixes (Day 1)**
- [ ] Standardize all error handling to use HttpException
- [ ] Add input validation DTOs for all endpoints
- [ ] Extract all magic numbers to constants
- [ ] Fix TypeScript strict mode errors
- [ ] Add proper file validation

### **Phase 2: Architecture (Day 2)**
- [ ] Separate AI service into extraction/scoring modules
- [ ] Implement repository pattern for data access
- [ ] Add service interfaces for dependency injection
- [ ] Create proper response DTOs
- [ ] Add comprehensive logging

### **Phase 3: Security & Performance (Day 3)**
- [ ] Add rate limiting to upload endpoints
- [ ] Implement request timeouts
- [ ] Add input sanitization
- [ ] Create health check endpoints
- [ ] Add monitoring and metrics

---

## 🎯 **Success Criteria**

### **Before Cleanup:**
- Error handling: Inconsistent (Error vs HttpException)
- Input validation: None
- Type safety: Many 'any' types
- Constants: Hardcoded throughout
- Security: No rate limiting or input sanitization

### **After Cleanup:**
- Error handling: Consistent HttpException usage
- Input validation: Comprehensive DTO validation
- Type safety: Strict TypeScript compliance
- Constants: Centralized configuration
- Security: Rate limiting and proper input sanitization

**Note: The AI service is well-architected with proper real AI integration and graceful fallbacks - no cleanup needed there.**

**Focus on error handling and input validation first - these are critical for production readiness.**