// User Types
export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'recruiter';
  profileCompleted?: boolean;
  fullName?: string;
  jobTitle?: string;
  companyName?: string;
  userPhoto?: string;
  companyLogo?: string;
  createdAt: string;
  updatedAt: string;
}

// Candidate Types
export interface Candidate {
  id: string;
  name: string;
  linkedinUrl?: string;
  rawText: string;
  skills: string[];
  experienceYears: number;
  workExperience: {
    company: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: any[];
  certifications: string[];
  roleFitScore?: number;
  keyStrengths: string[];
  potentialWeaknesses: string[];
  missingSkills: string[];
  interviewQuestions: string[];
  confidenceScore?: number;
  biasCheck?: string;
  jobRole: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Filter Types
export interface CandidateFilters {
  skill?: string;
  experience_min?: number;
  experience_max?: number;
  score_min?: number;
  score_max?: number;
  jobRole?: string;
}

// Dashboard Types
export interface DashboardMetrics {
  totalCandidates: number;
  averageRoleFitScore: number;
  shortlistCount: number;
  processingCount: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role?: 'admin' | 'recruiter';
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

// JWT Payload (what we get from decoded token)
export interface JwtPayload {
  email: string;
  sub: string;  // Contains the user._id
  role: 'admin' | 'recruiter';
  profileCompleted?: boolean;
  iat?: number;
  exp?: number;
}

// Error Log Types
export interface ErrorLog {
  id: string;
  timestamp: string;
  userOrSystem: string;
  action: string;
  target: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface ErrorLogFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  severity?: string;
  userOrSystem?: string;
  action?: string;
}

export interface PaginatedErrorLogsResponse {
  data: ErrorLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  timestamp: string;
  userOrSystem: string;
  action: string;
  target: string;
  details: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  userOrSystem?: string;
  action?: string;
  target?: string;
}

export interface PaginatedAuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

