import { useRouter } from 'next/navigation';
import ActivityItem from './ActivityItem';
import { RecentActivityData } from '@/types/dashboard';

const RecentActivity = ({ title, activities }: RecentActivityData) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <button 
          onClick={() => router.push('/candidates')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All
        </button>
      </div>
      
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;