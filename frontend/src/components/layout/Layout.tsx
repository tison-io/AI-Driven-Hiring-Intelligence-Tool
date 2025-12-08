'use client'

import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 md:ml-52 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}