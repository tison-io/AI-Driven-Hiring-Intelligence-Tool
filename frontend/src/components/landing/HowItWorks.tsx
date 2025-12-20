import React from 'react'
import { Upload, Lightbulb, CheckCircle } from 'lucide-react'

const steps = [
  {
    title: "Upload",
    description: "Import candidate resumes or paste linkedin URL. Our AI instantly analyzes and extracts key information.",
    icon: Upload
  },
  {
    title: "AI Analysis",
    description: "TalentScan analyzes skills, experience, and role fit while checking for bias in the evaluation.",
    icon: Lightbulb
  },
  {
    title: "Make Better Decisions",
    description: "Review insights, compare candidates, and move the best talent through your pipeline faster.",
    icon: CheckCircle
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-[#0D1737] py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center mb-4">
          How It Works
        </h2>

        {/* Subheading */}
        <p className="text-gray-400 text-center text-base sm:text-lg mb-16 max-w-2xl mx-auto">
          Get started in minutes with our intuitive platform
        </p>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] flex items-center justify-center shadow-lg">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks