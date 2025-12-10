import { useState, useEffect } from 'react';
import { errorLogsApi } from '@/lib/api';
import { ErrorLog, ErrorLogFilters, PaginatedErrorLogsResponse } from '@/types';

export const useErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchErrorLogs = async (filters?: ErrorLogFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedErrorLogsResponse = await errorLogsApi.getAll(filters);
      
      setErrorLogs(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch error logs');
      setErrorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  return {
    errorLogs,
    loading,
    error,
    pagination,
    fetchErrorLogs,
    refetch: () => fetchErrorLogs(),
  };
};