import { CheckCircle2, AlertTriangle } from 'lucide-react'

interface AIAnalysisSectionProps {
  keyStrengths: string[]
  potentialGaps: string[]
  missingSkills: string[]
}

export default function AIAnalysisSection({ keyStrengths, potentialGaps, missingSkills }: AIAnalysisSectionProps) {
  return (
    <div className="bg-[#0f1629] rounded-xl border border-gray-800 p-6 mb-8">
      <h2 className="text-xl font-bold text-white mb-6">AI Analysis</h2>
      
      {/* Key Strengths */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Key Strengths</h3>
        <div className="space-y-3">
          {keyStrengths.map((strength, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-300">{strength}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Potential Gaps */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Potential Gaps</h3>
        <div className="space-y-3">
          {potentialGaps.map((gap, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-300">{gap}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Missing Skills</h3>
        <div className="flex flex-wrap gap-2">
          {missingSkills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
