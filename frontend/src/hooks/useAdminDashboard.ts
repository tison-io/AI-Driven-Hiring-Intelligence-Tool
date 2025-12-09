import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import { AdminDashboardMetrics } from '@/types/dashboard';

export const useAdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await dashboardApi.getAdminMetrics();
      setData(metrics);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return { data, loading, error, refetch: fetchMetrics };
};
