import { CheckCircle2, Shield } from 'lucide-react'
import CircularProgress from '../ui/CircularProgress'

interface ScoreCardsProps {
  roleFitScore: number
  confidenceScore: number
  biasCheck: string
}

export default function ScoreCards({ roleFitScore, confidenceScore, biasCheck }: ScoreCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {/* Role Fit Score */}
      <div className="bg-f6f6f6 rounded-xl border border-gray-800 p-6">
        <h3 className="text-sm text-black mb-4 text-center">Role Fit Score</h3>
        <div className="flex items-center justify-center">
          <CircularProgress value={roleFitScore} color="#10b981" label="Score" />
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-f6f6f6 rounded-xl border border-gray-800 p-6">
        <h3 className="text-sm text-black mb-4 text-center">Confidence Score</h3>
        <div className="flex items-center justify-center">
          <CircularProgress value={confidenceScore} color="#3b82f6" label="Score" />
        </div>
      </div>

      {/* Bias Check */}
      <div className="bg-f6f6f6 rounded-xl border border-gray-800 p-6 flex flex-col items-center justify-center">
        <h3 className="text-sm text-black mb-4">Bias Check</h3>
        <Shield className="w-16 h-16 text-green-400 mb-3" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-lg font-semibold text-black">{biasCheck}</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">No bias detected</p>
      </div>
    </div>
  )
}
