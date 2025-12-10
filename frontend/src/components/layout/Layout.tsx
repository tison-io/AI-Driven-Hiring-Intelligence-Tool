'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <MobileHeader 
        onMenuClick={() => setIsMobileOpen(true)} 
        user={user}
      />
      <Sidebar 
        isOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
      />
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}