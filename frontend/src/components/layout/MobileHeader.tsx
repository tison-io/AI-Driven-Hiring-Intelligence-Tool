'use client'

import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  onMenuClick: () => void
  user?: {
    fullName?: string
    email?: string
    userPhoto?: string
  } | null
}

export default function MobileHeader({ onMenuClick, user }: MobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0a1628] border-b border-gray-800 flex items-center justify-between px-4 z-40">
      {/* Hamburger Button */}
      <button
        onClick={onMenuClick}
        className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* User Avatar */}
      <div className="flex items-center">
        {user?.userPhoto ? (
          <img 
            src={user.userPhoto} 
            alt={user.fullName || user.email || 'User'} 
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {(user?.fullName || user?.email)?.substring(0, 2).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </header>
  )
}
