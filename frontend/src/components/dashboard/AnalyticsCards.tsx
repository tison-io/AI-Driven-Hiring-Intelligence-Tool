import React from "react";
import { SourceAnalysis } from "@/types/dashboard";

interface AnalyticsCardsProps {
	highQualityRate: number;
	confidenceAverage: number;
	biasAlerts: number;
	sourceAnalysis: SourceAnalysis;
}

export default function AnalyticsCards({
	highQualityRate,
	confidenceAverage,
	biasAlerts,
	sourceAnalysis,
}: AnalyticsCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			{/* High Quality Rate */}
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-sm font-medium text-gray-500">
					High-Quality Rate
				</h3>
				<p className="text-2xl font-bold text-green-600">
					{highQualityRate}%
				</p>
				<p className="text-xs text-gray-400">Candidates Scoring 80%+</p>
			</div>
			{/* Confidence Average */}
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-sm font-medium text-gray-500">
					Confidence Average
				</h3>
				<p className="text-2xl font-bold text-green-600">
					{confidenceAverage}%
				</p>
				<p className="text-xs text-gray-400">
					AI evaluation confidence
				</p>
			</div>
			{/* Bias Alerts */}
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-sm font-medium text-gray-500">
					Bias Alerts
				</h3>
				<p className="text-2xl font-bold text-green-600">
					{biasAlerts}
				</p>
				<p className="text-xs text-gray-400">Candidates flagged</p>
			</div>
			{/* Source Analysis */}
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-sm font-medium text-gray-500">
					Source Performance
				</h3>
				<div className="space-y-1">
					<div className="flex justify-between text-sm">
						<span>Linkedin:</span>
						<span className="font-medium">
							{sourceAnalysis.linkedin.averageScore}%
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span>File Upload:</span>
						<span className="font-medium">
							{sourceAnalysis.file.averageScore}%
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
