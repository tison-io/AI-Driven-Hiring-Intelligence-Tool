'use client'
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from './Navbar'

const Hero = () => {
  const { user } = useAuth()
  const isLoggedIn = !!user
  const dashboardRoute = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'

  return (
    <section className="relative w-full bg-[#0D1737] px-4 sm:px-6 lg:px-8">
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#29B1B4]/10 via-[#6A80D9]/10 to-[#AA50FF]/10 pointer-events-none" />
      
      {/* Navbar */}
      <div className="relative z-20 pt-2">
        <Navbar />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">
                AI-Powered Ethical Hiring
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Hire Smarter,
                <br />
                Fairer, Faster
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
              Transform your recruitment process with AI-driven insights while
              ensuring fairness and eliminating bias. TalentScan AI helps you
              find the perfect candidates faster.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-row gap-4">
              {isLoggedIn ? (
                <Link
                  href={dashboardRoute}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Get Started for Free
                    <ChevronRight className="w-5 h-5" />
                  </Link>

                  <div className="p-[2px] bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] rounded-lg hover:opacity-90 transition-opacity">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center px-8 py-4 bg-[#0D1737] rounded-lg text-white font-semibold transition-all duration-200"
                    >
                      Log In
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Image - Hidden on mobile */}
          <div className="hidden lg:block relative">
            <div className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/scanHero.svg"
                alt="Team meeting discussing recruitment"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero