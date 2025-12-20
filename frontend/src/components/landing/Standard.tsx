import React from 'react'
import Image from 'next/image'
import { Zap, Scale, FileText } from 'lucide-react'

const features = [
  {
    title: "Efficiency",
    description: "Cut screening time by 80%",
    icon: Zap,
    color: "from-cyan-400 to-blue-500"
  },
  {
    title: "Fairness",
    description: "Eliminate unconscious bias",
    icon: Scale,
    color: "from-purple-400 to-pink-500"
  },
  {
    title: "Clarity",
    description: "Standardized data for every candidate",
    icon: FileText,
    color: "from-blue-400 to-indigo-500"
  }
];

const Standard = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-4">
          The Standard for Objective Hiring
        </h2>

        {/* Subheading */}
        <p className="text-gray-600 text-center text-base sm:text-lg mb-16 max-w-3xl mx-auto">
          One platform to evaluate resumes, LinkedIn profiles, and job fit—instantly and impartially.
        </p>

        {/* Image Placeholders Container */}
        <div className="relative mb-24 flex items-center justify-center min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]">
          {/* Background gradient blur */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 blur-3xl" />

          {/* First device (back) - rotated more */}
          <div
            className="absolute top-0 sm:top-8 left-1/2 w-full max-w-[280px] sm:max-w-[400px] lg:max-w-[500px] z-10"
            style={{
              transform: "translateX(-100%) translateY(10%) rotate(-8deg)",
              perspective: "1000px",
            }}
          >
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/images/lap11.svg"
                alt="Dashboard Preview"
                width={800}
                height={500}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Second device (front) - rotated less */}
          <div
            className="relative top-16 sm:top-24 left-1/2 w-full max-w-[300px] sm:max-w-[450px] lg:max-w-[550px] z-20"
            style={{
              transform: "translateX(-80%) translateY(20%) rotate(6deg)",
              perspective: "1000px",
            }}
          >
            <div className="relative rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="/images/lap22.svg"
                alt="Candidate Analysis"
                width={800}
                height={500}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center text-white`}>
                    <Icon className="w-8 h-8" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default Standard