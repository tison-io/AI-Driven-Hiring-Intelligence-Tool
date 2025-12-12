import { TrendingUp, TrendingDown } from 'lucide-react';
import { StatsCardData } from '@/types/dashboard';

const StatsCard = ({ title, value, change, trend }: StatsCardData) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? (
              <TrendingUp size={20} className="mr-1" />
            ) : (
              <TrendingDown size={20} className="mr-1" />
            )}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      {change && <p className="text-xs text-gray-500 mt-2">vs last month</p>}
    </div>
  );
};

export default StatsCard;