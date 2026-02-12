"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import AdminHeader from "@/components/admin/AdminHeader";
import MetricCard from "@/components/admin/MetricCard";
import SystemHealthCard from "@/components/admin/SystemHealthCard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import TrendChart from "@/components/admin/TrendChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminDashboard() {
	const { data, loading, error, aiData } = useAdminDashboard();

	return (
		<ProtectedRoute>
			<Layout>
				<AdminHeader currentPage="Admin Dashboard" />

				<div
					className="bg-[#F9FAFB] p-6"
					style={{ minHeight: "calc(100vh - 73px)" }}
				>
					<div className="max-w-7xl mx-auto">
						<p className="text-gray-600 mb-6">
							Monitor system performance and usage metrics across
							the platform
						</p>

						{loading && (
							<div className="item-center justify-center flex"><LoadingSpinner
							/></div>
						)}
						{error && (
							<p className="text-red-600">Error: {error}</p>
						)}

						{data && (
							<>
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Core Usage Metrics
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
									<MetricCard
										title="Total Candidates Processed"
										value={
											data.totalCandidatesProcessed
												.current
										}
										percentageChange={
											data.totalCandidatesProcessed
												.percentageChange
										}
										trend={
											data.totalCandidatesProcessed.trend
										}
										type="candidates"
									/>
									<MetricCard
										title="Average Role-Fit Score"
										value={data.averageRoleFitScore.current}
										percentageChange={
											data.averageRoleFitScore
												.percentageChange
										}
										trend={data.averageRoleFitScore.trend}
										type="score"
									/>
									<MetricCard
										title="Total Shortlisted"
										value={data.totalShortlisted.current}
										percentageChange={
											data.totalShortlisted
												.percentageChange
										}
										trend={data.totalShortlisted.trend}
										type="shortlisted"
									/>
								</div>

								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									System Health Metrics
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<SystemHealthCard
										type="latency"
										title="Avg. Evaluation Latency"
										value={
											data.systemHealth
												.averageProcessingTime / 1000
										}
										target={10.0}
										status={
											data.systemHealth
												.averageProcessingTime /
												1000 <
											10.0
												? "within"
												: "outside"
										}
									/>
									<SystemHealthCard
										type="errors"
										title="Parser/AI Errors (24h)"
										value={
											data.systemHealth
												.failedProcessingCount
										}
									/>
								</div>
								{aiData && (
									<>
										<h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">
											AI Model Performance
										</h2>

										{/* AI Performance Metric Cards */}
										<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
											<MetricCard
												title="Avg Confidence Score"
												value={
													aiData.currentConfidenceAvg || 0
												}
												percentageChange={0}
												trend="neutral"
												type="score"
											/>
											<MetricCard
												title="Bias Detection Rate"
												value={aiData.currentBiasRate || 0}
												percentageChange={0}
												trend="neutral"
												type="score"
											/>
											<MetricCard
												title="AI Reliability Score"
												value={
													aiData.aiReliabilityScore || 0
												}
												percentageChange={0}
												trend="neutral"
												type="score"
											/>
										</div>

										{/* AI Performance Charts */}
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
											<TrendChart
												data={aiData.roleFitTrend || []}
												title="Role-Fit Score Trend"
												color="#3B82F6"
												yAxisLabel="Average Score (%)"
											/>
											<TrendChart
												data={aiData.confidenceTrend || []}
												title="Confidence Score Trend"
												color="#10B981"
												yAxisLabel="Confidence (%)"
											/>
										</div>

										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
											<TrendChart
												data={aiData.biasTrend || []}
												title="Bias Detection Rate"
												color="#F59E0B"
												yAxisLabel="Detection Rate (%)"
											/>
										</div>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</Layout>
		</ProtectedRoute>
	);
}
