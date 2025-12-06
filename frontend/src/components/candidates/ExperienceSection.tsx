import { Briefcase, GraduationCap } from "lucide-react"

interface Experience {
  title: string
  company: string
  period: string
  description: string
}

interface Education {
  degree: string
  school: string
  year: string
}

interface ExperienceSectionProps {
  experience: Experience[]
  education: Education
}

export default function ExperienceSection({ experience, education }: ExperienceSectionProps) {
  return (
    <div className="bg-[#0f1629] rounded-xl border border-gray-800 p-6 mb-8">
      <h2 className="text-xl font-bold text-white mb-6">Experience & Education</h2>
      
      {/* Experience */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-xs text-gray-300"><Briefcase/></span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Experience</h3>
        </div>
        <div className="space-y-6 ml-8">
          {experience.map((exp, idx) => (
            <div key={idx}>
              <h4 className="text-white font-semibold">{exp.title}</h4>
              <p className="text-cyan-400 text-sm">{exp.company}</p>
              <p className="text-gray-400 text-sm mb-2">{exp.period}</p>
              <p className="text-gray-300 text-sm">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center">
            <span className="text-xs text-gray-300"><GraduationCap/></span>
          </div>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Education</h3>
        </div>
        <div className="ml-8">
          <h4 className="text-white font-semibold">{education.degree}</h4>
          <p className="text-cyan-400 text-sm">{education.school}</p>
          <p className="text-gray-400 text-sm">{education.year}</p>
        </div>
      </div>
    </div>
  )
}
