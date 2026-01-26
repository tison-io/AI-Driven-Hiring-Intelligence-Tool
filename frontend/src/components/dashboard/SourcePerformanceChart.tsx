import React from "react";
import { SourceAnalysis } from "@/types/dashboard";

interface SourcePerformanceChartProps {
	data: SourceAnalysis;
	title: string;
}

export default function SourcePerformanceChart({
	data,
	title,
}: SourcePerformanceChartProps) {
	const maxScore = Math.max(
		data.linkedin.averageScore,
		data.file.averageScore,
	);
	const chartHeight = 120;

	const getBarHeight = (score: number) => {
		return maxScore > 0 ? (score / maxScore) * chartHeight : 0;
	};

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>

			<div className="flex items-end justify-center space-x-8 mb-4">
				{/* LinkedIn Bar */}
				<div className="flex flex-col items-center">
					<div className="relative">
						<div
							className="w-12 bg-blue-500 rounded-t transition-all duration-300"
							style={{
								height: `${getBarHeight(data.linkedin.averageScore)}px`,
							}}
						/>
						<div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
							<span className="text-xs font-medium text-gray-900">
								{data.linkedin.averageScore}%
							</span>
						</div>
					</div>
					<div className="mt-2 text-xs text-gray-600 text-center">
						<div>LinkedIn</div>
						<div className="text-gray-400">
							({data.linkedin.count})
						</div>
					</div>
				</div>

				{/* File Upload Bar */}
				<div className="flex flex-col items-center">
					<div className="relative">
						<div
							className="w-12 bg-green-500 rounded-t transition-all duration-300"
							style={{
								height: `${getBarHeight(data.file.averageScore)}px`,
							}}
						/>
						<div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
							<span className="text-xs font-medium text-gray-900">
								{data.file.averageScore}%
							</span>
						</div>
					</div>
					<div className="mt-2 text-xs text-gray-600 text-center">
						<div>File Upload</div>
						<div className="text-gray-400">({data.file.count})</div>
					</div>
				</div>
			</div>

			<div className="text-xs text-gray-400 text-center">
				Average Role-Fit Scores by Source
			</div>
		</div>
	);
}
