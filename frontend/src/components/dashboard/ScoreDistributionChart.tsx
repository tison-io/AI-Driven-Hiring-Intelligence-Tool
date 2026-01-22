import React from "react";
import { ScoreDistribution } from "@/types/dashboard";

interface ScoreDistributionChartProps {
	data: ScoreDistribution;
	title: string;
}

export default function ScoreDistributionChart({
	data,
	title,
}: ScoreDistributionChartProps) {
	// Calculate total candidates for percentage calculations
	const total = Object.values(data).reduce((sum, count) => sum + count, 0);
	const chartData = Object.entries(data).map(([range, count]) => ({
		range,
		count,
		percentage: total > 0 ? Math.round((count / total) * 100) : 0,
	}));

	const getBarColor = (range: string) => {
		switch (range) {
			case "0-20":
				return "bg-red-500";
			case "21-40":
				return "bg-orange-500";
			case "41-60":
				return "bg-yellow-500";
			case "61-80":
				return "bg-blue-500";
			case "81-100":
				return "bg-green-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				{title}
			</h3>
			<div className="space-y-3">
				{chartData.map(({ range, count, percentage }) => (
					<div key={range} className="flex items-center">
						<div className="w-16 text-sm text-gray-600">
							{range}%
						</div>
						<div className="flex-1 mx-3">
							<div className="bg-gray-200 rounded-full h-4 relative">
								<div
									className={`${getBarColor(range)} h-4 rounded-full transition-all duration-300`}
									style={{ width: `${percentage}%` }}
								/>
							</div>
						</div>
						<div className="w-12 text-sm text-gray-900 text-right">
							{count}
						</div>
					</div>
				))}
			</div>
			<div className="mt-4 text-sm text-gray-500">
				Total candidates: {total}
			</div>
		</div>
	);
}
