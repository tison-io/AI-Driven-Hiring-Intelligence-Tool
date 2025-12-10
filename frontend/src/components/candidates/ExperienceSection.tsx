import { Briefcase, GraduationCap } from "lucide-react"

interface WorkExperience {
  company: string
  jobTitle: string
  startDate: string
  endDate: string
  description: string
}

interface Education {
  degree: string
  institution: string
  year_graduated: string
}

interface ExperienceSectionProps {
  experience: WorkExperience[]
  education: Education
}

export default function ExperienceSection({ experience, education }: ExperienceSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6 mb-8">
      <h2 className="text-xl font-bold text-black mb-6">Experience & Education</h2>
      
      {/* Experience */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500"><Briefcase/></span>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Experience</h3>
        </div>
        <div className="space-y-6 ml-8">
          {/* Handle empty/undefined arrays safely */}
          {experience && experience.length > 0 ? (
            experience.map((exp, idx) => (
              <div key={idx}>
                <h4 className="text-black font-semibold">{exp.jobTitle}</h4>
                <p className="text-cyan-400 text-sm">{exp.company}</p>
                <p className="text-gray-400 text-sm mb-2">
                  {exp.startDate} - {exp.endDate}
                </p>
                <p className="text-gray-900 text-sm">{exp.description}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm italic">No experience listed.</p>
          )}
        </div>
      </div>

      {/* Education */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded flex items-center justify-center">
            <span className="text-xs text-gray-500"><GraduationCap/></span>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Education</h3>
        </div>
        <div className="ml-8">
           <h4 className="text-black font-semibold">{education?.degree || education?.institution}</h4>
           <p className="text-cyan-400 text-sm">{education?.institution}</p>
           <p className="text-gray-400 text-sm">{education?.year_graduated}</p>
        </div>
      </div>
    </div>
  )
}