import { CheckCircle2, Shield, Info } from 'lucide-react'
import CircularProgress from '../ui/CircularProgress'
import { ScoreCardsProps } from '@/types'

export default function ScoreCards({ roleFitScore = 0, confidenceScore = 0, biasCheck = 'Pending' }: ScoreCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Role Fit Score */}
      <div className="bg-f6f6f6 rounded-xl border border-gray-300 p-6">
        <h3 className="text-sm text-black mb-4 text-center">Role Fit Score</h3>
        <div className="flex items-center justify-center">
          <CircularProgress value={roleFitScore} color="#10b981" label="Score" />
        </div>
      </div>

      {/* Confidence Score */}
      <div className="bg-f6f6f6 rounded-xl border border-gray-300 p-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h3 className="text-sm text-black">Confidence Score</h3>
          <div className="relative group">
            <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
            <div className="absolute left-1/2 -translate-x-1/2 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              Confidence is based on resume completeness, data density, and clarity of experience descriptions.
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <CircularProgress value={confidenceScore} color="#3b82f6" label="Score" />
        </div>
      </div>

      {/* Bias Check */}
      <div className="bg-f6f6f6 rounded-xl border border-gray-300 p-6 flex flex-col items-center justify-center">
        <h3 className="text-sm text-black mb-4">Bias Check</h3>
        <Shield className="w-16 h-16 text-green-400 mb-3" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-lg font-semibold text-black">{biasCheck || 'Pending'}</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">No bias detected</p>
      </div>
    </div>
  )
}
