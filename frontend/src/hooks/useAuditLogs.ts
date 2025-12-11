import { useState, useEffect } from 'react';
import { auditLogsApi } from '@/lib/api';
import { AuditLog, AuditLogFilters, PaginatedAuditLogsResponse } from '@/types';

export const useAuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchAuditLogs = async (filters?: AuditLogFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedAuditLogsResponse = await auditLogsApi.getAll(filters);
      
      setAuditLogs(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return {
    auditLogs,
    loading,
    error,
    pagination,
    fetchAuditLogs,
    refetch: () => fetchAuditLogs(),
  };
};