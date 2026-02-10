'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import MainHeader from './MainHeader'
import { LayoutProps } from '@/types'

export default function Layout({ children }: LayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Don't show MainHeader on admin pages (they have their own AdminHeader)
  const isAdminPage = pathname?.startsWith('/admin')

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
        {!isAdminPage && <MainHeader />}
        {children}
      </main>
    </div>
  )
}