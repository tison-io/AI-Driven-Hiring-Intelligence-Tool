import { Star, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ShortlistedCandidate {
  _id: string
  name: string
  role: string
  score: number
  time: string
}

interface ShortlistedCandidatesProps {
  candidates: ShortlistedCandidate[]
}

export default function ShortlistedCandidates({ candidates }: ShortlistedCandidatesProps) {
  const router = useRouter()

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 80) return 'bg-blue-100 text-blue-700 border-blue-300'
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900">Shortlisted Candidates</h2>
        </div>
        <button
          onClick={() => router.push('/candidates?shortlisted=true')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No shortlisted candidates yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <div
              key={candidate._id}
              onClick={() => router.push(`/candidates/${candidate._id}`)}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{candidate.name}</h3>
                <p className="text-sm text-gray-500">{candidate.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">{candidate.time}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreBadge(candidate.score)}`}>
                  {candidate.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
