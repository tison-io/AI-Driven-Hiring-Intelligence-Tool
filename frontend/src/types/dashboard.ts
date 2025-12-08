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

export interface DashboardData {
  stats: StatsCardData[];
  recentActivity: RecentActivityData;
  userName: string;
}