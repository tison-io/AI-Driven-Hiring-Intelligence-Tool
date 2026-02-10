export enum NotificationType {
  NEW_APPLICATION = 'NEW_APPLICATION',
  STATUS_CHANGE = 'STATUS_CHANGE',
  AI_ANALYSIS_COMPLETE = 'AI_ANALYSIS_COMPLETE',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  CANDIDATE_SHORTLISTED = 'CANDIDATE_SHORTLISTED',
  BIAS_ALERT = 'BIAS_ALERT',
  DUPLICATE_CANDIDATE = 'DUPLICATE_CANDIDATE',
  BULK_PROCESSING_COMPLETE = 'BULK_PROCESSING_COMPLETE',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SECURITY_ALERT = 'SECURITY_ALERT',
  HEALTH_METRICS_ALERT = 'HEALTH_METRICS_ALERT',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  USER_MILESTONE_REACHED = 'USER_MILESTONE_REACHED',
  PROCESSING_MILESTONE = 'PROCESSING_MILESTONE',
  MONTHLY_ANALYTICS_REPORT = 'MONTHLY_ANALYTICS_REPORT',
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
}
