import ProtectedRoute from '@/components/auth/ProtectedRoute';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

export default function ExportPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
              <p className="text-gray-500">CSV/XLSX export options, report generation</p>
            </div>
            <div className="hidden md:block">
              <NotificationDropdown />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}