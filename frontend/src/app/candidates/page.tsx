import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function CandidatesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Candidates</h1>
          <p className="text-gray-500">Search, filters, pagination, candidate cards</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}