'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import AdminHeader from '@/components/admin/AdminHeader';
import { AuditLogsTable } from '@/components/admin/AuditLogsTable';

export default function AuditLogsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdminHeader currentPage="Audit Logs" />
        
        <div className="bg-[#F9FAFB] p-6" style={{ minHeight: 'calc(100vh - 73px)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600 mt-1">Track user actions and system events for compliance and security</p>
            </div>
            
            <AuditLogsTable />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}