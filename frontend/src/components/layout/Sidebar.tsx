'use client'

import { useState } from 'react'
import { LayoutDashboard, Users, Upload, Download, Menu, X, Settings, FileText, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState('new-evaluations')
  const router = useRouter()

  const navItems = [
    { id: 'new-evaluations', label: 'New Evaluations', icon: FileText, href: '/evaluations/new', featured: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'candidate-pipeline', label: 'Candidate Pipeline', icon: Users, href: '/candidates', featured: true },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },

  ]
  const handleNavClick = (id: string, href: string) => {
    setActiveItem(id);
    router.push(href)
  
  }

  return (
    <div className="fixed inset-y-0 left-0 w-60 bg-[#0a1628] border-r border-gray-800 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-white text-lg font-semibold">TalentScan AI</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-xs uppercase tracking-wider">NavBar</span>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </div>

        {/* Main Nav Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.featured
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                  : isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile --Placeholder before auth logic for the frontend is completed */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
            SJ
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Sarah Johnson</p>
            <p className="text-gray-400 text-xs">Recruiter</p>
          </div>
        </div>
      </div>
    </div>
  )
}