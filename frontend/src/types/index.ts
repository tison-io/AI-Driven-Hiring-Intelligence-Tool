import { ReactNode } from 'react';

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
  // Additional properties used in components
  title?: string;
  experience?: any[];
  potentialGaps?: string[];
  isShortlisted?: boolean;
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

// Extended Candidate Types
export interface CandidateWithShortlist extends Candidate {
  isShortlisted?: boolean;
}

export interface UploadResponse {
  candidate: Candidate;
  message: string;
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

// Modal Props Types
export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => void;
}

export interface DeleteCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  candidateName: string;
}

export interface AIEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate;
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Form Data Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  agreeToTerms: boolean;
}

export interface RegisterFormErrors {
  email?: string;
  password?: string;
  agreeToTerms?: string;
}

// Experience & Education Types
export interface WorkExperience {
  company: string;
  jobTitle: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year_graduated: string;
}

// Component Props Types
export interface ExperienceSectionProps {
  experience: WorkExperience[];
  education?: Education;
}

export interface ShortlistedCandidate {
  _id: string;
  name: string;
  role: string;
  score: number;
  time: string;
}

export interface ShortlistedCandidatesProps {
  candidates: ShortlistedCandidate[];
}

export interface CandidateDetailProps {
  candidate: CandidateWithShortlist;
  candidateId: string;
}

export interface ScoreCardsProps {
  roleFitScore?: number;
  confidenceScore?: number;
  biasCheck?: string;
}

export interface AIAnalysisSectionProps {
  keyStrengths: string[];
  potentialGaps?: string[];
  missingSkills: string[];
}

export interface InterviewQuestionsProps {
  questions: string[];
}

export interface CandidateActionsProps {
  onShortlist: () => void;
  onDownloadReport: () => void;
  isDownloadingReport: boolean;
  isShortlisted: boolean;
}

export interface CandidateHeaderProps {
  name: string;
  title?: string;
  linkedinUrl?: string;
  onDelete: () => void;
}

// Auth Form Types
export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileData {
  fullName: string;
  jobTitle: string;
  companyName: string;
  userPhoto: File | null;
  companyLogo: File | null;
}

// UI Component Props
export interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  redirectTo?: string;
  imageSrc?: string;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export interface CircularProgressProps {
  value: number;
  color: string;
  label: string;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}

// Hook Types
export interface CandidatesFilters {
  search?: string;
  experience_min?: number;
  experience_max?: number;
  score_min?: number;
  score_max?: number;
  skill?: string;
  jobRole?: string;
}

// Layout Component Props
export interface LayoutProps {
  children: ReactNode;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MobileHeaderProps {
  onMenuClick: () => void;
  user?: {
    fullName?: string;
    email?: string;
    userPhoto?: string;
  } | null;
}

// Admin Component Props
export interface AdminHeaderProps {
  currentPage: string;
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  percentageChange: number;
  trend: 'up' | 'down' | 'neutral';
  type: 'candidates' | 'score' | 'shortlisted';
}

export interface SystemHealthCardProps {
  type: 'latency' | 'errors';
  title: string;
  value: number;
  target?: number;
  status?: 'within' | 'outside';
}

// Settings Component Props
export interface ProfileSectionProps {
  formData: {
    fullName: string;
    jobTitle: string;
    companyName: string;
  };
  userEmail?: string;
  userPhoto?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoChange: (file: File) => void;
  onSave: () => void;
  memberSince: string;
  lastLogin: string;
}

export interface SecuritySectionProps {
  onChangePassword: () => void;
}

export interface DeleteAccountSectionProps {
  onOpenModal: () => void;
}

// Route Component Props
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'recruiter';
}

export interface PublicRouteProps {
  children: ReactNode;
}

// Dashboard Component Props
export interface DashboardHeaderProps {
  userName: string;
}

// Form Component Props
export interface EvaluationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

// Icon Component Props
export interface StatusIconProps {
  status: 'completed' | 'processing' | 'error';
  size?: number;
}

// Error Boundary Types
export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Toast Types
export interface ToastPromiseMessages {
  loading: string;
  success: string;
  error: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  style?: React.CSSProperties;
  icon?: string;
}

