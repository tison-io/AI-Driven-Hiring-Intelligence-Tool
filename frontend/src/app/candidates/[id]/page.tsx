import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface CandidateDetailPageProps {
  params: { id: string }
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Candidate Details</h1>
          <p className="text-gray-500">Candidate ID: {params.id}</p>
          <p className="text-gray-500">Full AI evaluation, scores, strengths, weaknesses, interview questions</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}