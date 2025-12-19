import React from 'react'
import { Lock, Trash2, CheckCircle, BarChart3, ShieldCheck } from 'lucide-react'

const ethicsFeatures = [
  {
    icon: Lock,
    title: "No Private Scraping",
    description: "We only process user-uploaded data and public API fields."
  },
  {
    icon: Trash2,
    title: "Zero Retention Option",
    description: "Data can be set to auto-delete after processing."
  },
  {
    icon: CheckCircle,
    title: "Explainable AI",
    description: "We don't just give a score, we show you why the score was given."
  },
  {
    icon: BarChart3,
    title: "Bias Detection",
    description: "Continuous monitoring for discriminatory patterns in evaluation."
  }
];

const Ethical = () => {
  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:p-24">
      <div className="max-w-7xl mx-auto">
        {/* Main Card */}
        <div className="bg-[#080E25] rounded-2xl p-6 sm:p-8 lg:p-16 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-3 sm:mb-4">
            Ethical AI by Design
          </h2>

          {/* Subheading */}
          <p className="text-gray-400 text-center text-sm sm:text-base lg:text-lg mb-8 sm:mb-12 max-w-3xl mx-auto">
            We take privacy and fairness seriously—built into every layer of our system
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {ethicsFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex gap-3 sm:gap-4 p-4 sm:p-6 bg-[#0D1737] rounded-xl border border-[#1a2847] hover:border-[#2a3857] hover:bg-[#111d3d] transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Ethical