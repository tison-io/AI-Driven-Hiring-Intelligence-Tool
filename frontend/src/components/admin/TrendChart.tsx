import React from "react";

interface TrendDataPoint {
	date: string;
	value: number;
}

interface TrendChartProps {
	data: TrendDataPoint[];
	title: string;
	color: string;
	yAxisLabel: string;
}

export default function TrendChart({
	data,
	title,
	color,
	yAxisLabel,
}: TrendChartProps) {
	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					{title}
				</h3>
				<div className="flex items-center justify-center h-64 text-gray-500">
					No data available
				</div>
			</div>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.value));
	const minValue = Math.min(...data.map((d) => d.value));
	const range = maxValue - minValue || 1;

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	const getYPosition = (value: number) => {
		return 200 - ((value - minValue) / range) * 180;
	};

	const pathDate = data
		.map((point, index) => {
			const x = (index / (data.length - 1)) * 400;
			const y = getYPosition(point.value);
			return `${index === 0 ? "M" : "L"} ${x} ${y}`;
		})
		.join(" ");

	return (
		<div className="bg-white rounded-lg shadow p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				{title}
			</h3>
			<div className="relative">
				<svg
					width="100%"
					height="240"
					viewBox="0 0 450 240"
					className="overflow-visible"
				>
					{/* Grid lines */}
					{[0, 1, 2, 3, 4].map((i) => (
						<line
							key={i}
							x1="0"
							y1={20 + i * 45}
							x2="400"
							y2={20 + i * 45}
							stroke="#f3f4f6"
							strokeWidth="1"
						/>
					))}

					{/* Y-axis labels */}
					{[0, 1, 2, 3, 4].map((i) => {
						const value = maxValue - (i * range) / 4;
						return (
							<text
								key={i}
								x="-10"
								y={25 + i * 45}
								textAnchor="end"
								className="text-xs fill-gray-500"
							>
								{value.toFixed(0)}
							</text>
						);
					})}

					{/* Trend line */}
					<path
						d={pathDate}
						fill="none"
						stroke={color}
						strokeWidth="2"
						className="drop-shadow-sm"
					/>

					{/* Data points */}
					{data.map((point, index) => (
						<circle
							key={index}
							cx={(index / (data.length - 1)) * 400}
							cy={getYPosition(point.value)}
							r="4"
							fill={color}
							className="drop-shadow-sm"
						>
							<title>{`${formatDate(point.date)}: ${point.value}${yAxisLabel.includes("%") ? "%" : ""}`}</title>
						</circle>
					))}
				</svg>

				{/* X-axis labels */}
				<div className="flex justify-between mt-2 text-xs text-gray-500">
					<span>{formatDate(data[0].date)}</span>
					{data.length > 2 && (
						<span>
							{formatDate(data[Math.floor(data.length / 2)].date)}
						</span>
					)}
					<span>{formatDate(data[data.length - 1].date)}</span>
				</div>
			</div>
			<div className="mt-4 text-sm text-gray-500">{yAxisLabel}</div>
		</div>
	);
}
