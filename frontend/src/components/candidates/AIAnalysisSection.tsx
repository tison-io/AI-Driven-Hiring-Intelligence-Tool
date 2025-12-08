import { CheckCircle2, AlertTriangle } from 'lucide-react'

interface AIAnalysisSectionProps {
  keyStrengths: string[]
  potentialGaps: string[]
  missingSkills: string[]
}

export default function AIAnalysisSection({ keyStrengths, potentialGaps, missingSkills }: AIAnalysisSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-6 p-4 md:p-6 mb-6 md:mb-8">
      <h2 className="text-lg md:text-xl font-bold text-black mb-4 md:mb-6">AI Analysis</h2>
      
      {/* Key Strengths */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4">Key Strengths</h3>
        <div className="space-y-2 md:space-y-3">
          {keyStrengths.map((strength, idx) => (
            <div key={idx} className="flex items-start gap-2 md:gap-3">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base text-gray-600">{strength}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Potential Gaps */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4">Potential Gaps</h3>
        <div className="space-y-2 md:space-y-3">
          {potentialGaps.map((gap, idx) => (
            <div key={idx} className="flex items-start gap-2 md:gap-3">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm md:text-base text-gray-600">{gap}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      <div>
        <h3 className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 md:mb-4">Missing Skills</h3>
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
