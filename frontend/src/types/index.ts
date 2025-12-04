// User Types
export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'recruiter';
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
  iat?: number;
  exp?: number;
}

