export interface StatsCardData {
	title: string;
	value: string | number;
	change: string;
	trend: "up" | "down";
}

export interface ActivityItemData {
	name: string;
	role: string;
	time: string;
	status: "completed" | "processing" | "error";
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
	highQualityRate: number;
	confidenceAverage: number;
	biasAlerts: number;
	sourceAnalysis: SourceAnalysis;
	scoreDistribution: ScoreDistribution;
}

export interface MetricWithChange {
	current: number;
	percentageChange: number;
	trend: "up" | "down" | "neutral";
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

export interface SourceAnalysis {
	linkedin: {
		count: number;
		averageScore: number;
	};
	file: {
		count: number;
		averageScore: number;
	};
}

export interface ScoreDistribution {
	"0-20": number;
	"21-40": number;
	"41-60": number;
	"61-80": number;
	"81-100": number;
}

export interface AnalyticsData {
	scoreDistribution: ScoreDistribution;
	biasAlerts: number;
	sourceAnalysis: SourceAnalysis;
	highQualityRate: number;
	confidenceAverage: number;
}

export interface TrendDataPoint {
	date: string;
	value: number;
}

export interface AIPerformanceData {
	confidenceTrend: TrendDataPoint[];
	biasTrend: TrendDataPoint[];
	roleFitTrend: TrendDataPoint[];
	aiReliabilityScore: number;
	currentConfidenceAvg: number;
	currentBiasRate: number;
}
