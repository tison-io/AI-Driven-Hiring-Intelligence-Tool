import StatusIcon from '@/components/icons/StatusIcon';
import { ActivityItemData } from '@/types/dashboard';

const ActivityItem = ({ name, role, time, status, score }: ActivityItemData) => {

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <StatusIcon status={status} size={20} />
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
      
      <div className="text-right">
        {score && (
          <p className="text-sm font-medium text-gray-900">{score}%</p>
        )}
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

export default ActivityItem;