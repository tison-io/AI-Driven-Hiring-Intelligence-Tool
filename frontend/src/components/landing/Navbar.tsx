import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Navbar = () => {
  return (
    <nav className="bg-white border border-gray-200 rounded-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Name */}
          <div className="flex items-center gap-2">
            <Image src="/images/logo1.svg" alt="TalentScan AI" width={32} height={32} />
            <span className="text-xl font-semibold text-gray-900">TalentScan AI</span>
          </div>

          {/* Middle: Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#ethics" className="text-gray-700 hover:text-gray-900 transition-colors">
              Ethics
            </a>
            <a href="#faq" className="text-gray-700 hover:text-gray-900 transition-colors">
              FAQ
            </a>
          </div>

          {/* Right: Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <div className="p-[2px] bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] rounded-lg hover:opacity-90 transition-opacity">
              <Link
                href="/auth/login"
                className="block px-6 py-2 bg-white rounded-lg text-black font-semibold"
              >
                Login
              </Link>
            </div>
            <Link
              href="/auth/register"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar