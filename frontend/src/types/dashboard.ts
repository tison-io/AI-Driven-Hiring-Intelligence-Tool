export interface StatsCardData {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
}

export interface ActivityItemData {
  name: string;
  role: string;
  time: string;
  status: 'completed' | 'processing' | 'error';
  score?: number;
}

export interface RecentActivityData {
  title: string;
  activities: ActivityItemData[];
}

export interface ShortlistedCandidate {
  _id: string;
  name: string;
  role: string;
  score: number;
  time: string;
}

export interface DashboardData {
  stats: StatsCardData[];
  recentActivity: RecentActivityData;
  shortlistedCandidates: ShortlistedCandidate[];
  userName: string;
}

export interface MetricWithChange {
  current: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface SystemHealth {
  averageProcessingTime: number;
  successRate: number;
  failedProcessingCount: number;
}

export interface AdminDashboardMetrics {
  totalCandidatesProcessed: MetricWithChange;
  averageRoleFitScore: MetricWithChange;
  totalShortlisted: MetricWithChange;
  systemHealth: SystemHealth;
}