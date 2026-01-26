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
					<div className="text-center">
						<p className="text-lg mb-2">Insufficient Data</p>
						<p className="text-sm">Not enough candidates processed to generate trend data</p>
					</div>
				</div>
			</div>
		);
	}

	const maxValue = Math.max(...data.map((d) => d.value));
	const minValue = Math.min(...data.map((d) => d.value));
	
	// Improved scaling logic
	let range = maxValue - minValue;
	let adjustedMin = minValue;
	let adjustedMax = maxValue;
	
	// For confidence scores, cap at 100
	if (yAxisLabel.toLowerCase().includes('confidence')) {
		adjustedMax = Math.min(100, maxValue);
		adjustedMin = Math.max(0, minValue);
		range = adjustedMax - adjustedMin;
	} else {
		// If range is too small, add padding
		if (range < 5) {
			const padding = Math.max(5, maxValue * 0.1);
			adjustedMin = Math.max(0, minValue - padding);
			adjustedMax = maxValue + padding;
			range = adjustedMax - adjustedMin;
		}
	}
	
	// Ensure minimum range for better visualization
	if (range === 0) {
		range = Math.max(10, maxValue * 0.2);
		adjustedMin = Math.max(0, maxValue - range / 2);
		adjustedMax = maxValue + range / 2;
		if (yAxisLabel.toLowerCase().includes('confidence')) {
			adjustedMax = Math.min(100, adjustedMax);
		}
		range = adjustedMax - adjustedMin;
	}

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	const getYPosition = (value: number) => {
		return 200 - ((value - adjustedMin) / range) * 180;
	};

	const pathDate = data
		.map((point, index) => {
			const x = data.length === 1 ? 200 : (index / (data.length - 1)) * 400;
			const y = getYPosition(point.value);
			return `${index === 0 ? "M" : "L"} ${x} ${y}`;
		})
		.join(" ");

	// Generate Y-axis labels with better distribution
	const generateYAxisLabels = () => {
		const labels = [];
		for (let i = 0; i <= 4; i++) {
			const value = adjustedMax - (i * range) / 4;
			labels.push({
				value: Math.round(value * 100) / 100,
				y: 25 + i * 45
			});
		}
		return labels;
	};

	const yAxisLabels = generateYAxisLabels();

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
					{yAxisLabels.map((label, i) => (
						<text
							key={i}
							x="-10"
							y={label.y}
							textAnchor="end"
							className="text-xs fill-gray-500"
						>
							{label.value}
						</text>
					))}

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
							cx={data.length === 1 ? 200 : (index / (data.length - 1)) * 400}
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
