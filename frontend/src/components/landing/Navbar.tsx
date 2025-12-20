'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, Zap, Lightbulb, ShieldCheck, HelpCircle } from 'lucide-react'
import Logo from '../../../public/images/talentScanLogo.svg'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const navItems = [
    { label: 'Features', href: '#features', icon: Zap },
    { label: 'How It Works', href: '#how-it-works', icon: Lightbulb },
    { label: 'Ethics', href: '#ethics', icon: ShieldCheck },
    { label: 'FAQ', href: '#faq', icon: HelpCircle },
  ]

  return (
    <>
      <nav className="bg-white border border-gray-200 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Name */}
            <div className="flex items-center gap-2">
              <Image src="/images/logo1.svg" alt="TalentScan AI" width={32} height={32} />
              <span className="text-xl font-semibold text-gray-900">TalentScan AI</span>
            </div>

            {/* Middle: Navigation Links (Desktop) */}
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

            {/* Right: Buttons (Desktop) */}
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

            {/* Hamburger Menu Button (Mobile) */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#0a1628] border-l border-gray-800 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src={Logo.src}
                alt="TalentScan AI" 
                className="w-8 h-8 object-cover"
              />
              <h1 className="text-white text-lg font-semibold">TalentScan AI</h1>
            </div>
            <button
              onClick={closeMenu}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              )
            })}
          </div>

          {/* Auth Buttons */}
          <div className="mt-6 space-y-3">
            <div className="p-[2px] bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] rounded-lg hover:opacity-90 transition-opacity">
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="block px-6 py-3 bg-[#0a1628] rounded-lg text-white font-semibold text-center"
              >
                Login
              </Link>
            </div>
            <Link
              href="/auth/register"
              onClick={closeMenu}
              className="block px-6 py-3 rounded-lg bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-semibold hover:opacity-90 transition-opacity text-center"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Navbar