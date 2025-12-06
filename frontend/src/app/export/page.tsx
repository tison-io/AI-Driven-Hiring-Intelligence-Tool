import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ExportPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Export Data</h1>
          <p className="text-gray-500">CSV/XLSX export options, report generation</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}