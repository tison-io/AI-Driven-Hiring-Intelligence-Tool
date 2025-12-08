import React from 'react';
import StatusIcon from '@/components/icons/StatusIcon';
import { ActivityItemData } from '@/types/dashboard';

const ActivityItem: React.FC<ActivityItemData> = ({ 
  name, 
  role, 
  time, 
  status, 
  score 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <StatusIcon status={status} />
          <div>
            <h4 className="font-medium text-gray-900">{name}</h4>
            <p className="text-sm text-gray-600">{role}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{time}</span>
        {score && (
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {score}
          </span>
        )}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default ActivityItem;