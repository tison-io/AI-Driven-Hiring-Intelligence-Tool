'use client';

import { Users, Target, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  percentageChange: number;
  trend: 'up' | 'down' | 'neutral';
  type: 'candidates' | 'score' | 'shortlisted';
}

export default function MetricCard({ title, value, percentageChange, trend, type }: MetricCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'candidates':
        return <Users className="w-5 h-5 text-gray-600" />;
      case 'score':
        return <Target className="w-5 h-5 text-gray-600" />;
      case 'shortlisted':
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatValue = () => {
    if (type === 'score') {
      return typeof value === 'number' ? `${value}%` : value;
    }
    return value;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {getIcon()}
      </div>
      
      <div className="mb-3">
        <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
      </div>
      
      <div className="flex items-center space-x-1 text-sm">
        {getTrendIcon()}
        <span className={getTrendColor()}>
          {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(percentageChange)}%
        </span>
        <span className="text-gray-500">vs last month</span>
      </div>
    </div>
  );
}