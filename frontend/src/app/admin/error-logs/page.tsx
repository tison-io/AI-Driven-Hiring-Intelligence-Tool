'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import AdminHeader from '@/components/admin/AdminHeader';
import { ErrorLogsTable } from '@/components/admin/ErrorLogsTable';

export default function ErrorLogsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdminHeader currentPage="Error Logs" />
        
        <div className="bg-[#F9FAFB] p-6" style={{ minHeight: 'calc(100vh - 73px)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
              <p className="text-gray-600 mt-1">Monitor system errors and parsing failers accross the platform</p>
            </div>
            
            <ErrorLogsTable />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}