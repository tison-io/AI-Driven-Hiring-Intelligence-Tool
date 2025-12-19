import React from 'react'
import { Clock, EyeOff, Users } from 'lucide-react'

const problems = [
  {
    title: "Resume Fatigue",
    description: "Recruiters spend average 6 seconds per resume, missing qualified talent buried in bad formatting.",
    icon: Clock
  },
  {
    title: "Unconscious Bias",
    description: "Subjective screening criteria often let unconscious bias creep into the shortlist process.",
    icon: EyeOff
  },
  {
    title: "Inconsistent Data",
    description: "Comparing a LinkedIn profile to a PDF resume is apples-to-oranges. You need a unified data standard.",
    icon: Users
  }
];

const Hiring = () => {
  return (
    <section className="bg-[#0D1737] py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-4 sm:mb-6">
          The Hiring Bottleneck
        </h2>

        {/* Subheading */}
        <p className="text-gray-400 text-center text-base sm:text-lg lg:text-xl mb-12 sm:mb-16 max-w-4xl mx-auto">
          Modern recruiting faces critical challenges that slow down hiring and compromise quality
        </p>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div 
                key={index}
                className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-xl"
              >
                {/* Icon */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] flex items-center justify-center">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-3 sm:mb-4">
                  {problem.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm sm:text-base text-center leading-relaxed">
                  {problem.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default Hiring