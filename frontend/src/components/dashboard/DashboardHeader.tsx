import React from 'react';

interface DashboardHeaderProps {
  userName: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <div className="mb-8">
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
  );
};

export default DashboardHeader;