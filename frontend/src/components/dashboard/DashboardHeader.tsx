import { DashboardHeaderProps } from '@/types';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

const DashboardHeader = ({ userName }: DashboardHeaderProps) => {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userName}
        </h1>
        <p className="text-gray-600 mt-2">
          Here is your hiring velocity.
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Track your recruitment performance and recent activity
        </p>
      </div>
      <div className="hidden md:block">
        <NotificationDropdown />
      </div>
    </div>
  );
};

export default DashboardHeader;