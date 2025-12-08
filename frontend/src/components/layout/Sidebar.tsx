'use client'

import { LayoutDashboard, Users, Upload, Download, Menu, X, Settings, FileText, ChevronLeft, AlertCircle, FileSearch } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Logo from '../../../public/images/talentScanLogo.svg'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'error-logs', label: 'Error Logs', icon: AlertCircle, href: '/admin/error-logs' },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileSearch, href: '/admin/audit-logs' },
  ]

  const recruiterNavItems = [
    { id: 'new-evaluations', label: 'New Evaluations', icon: FileText, href: '/evaluations/new' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'candidate-pipeline', label: 'Candidate Pipeline', icon: Users, href: '/candidates' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ]

  const navItems = user?.role === 'admin' ? adminNavItems : recruiterNavItems

  const handleNavClick = (href: string) => {
    router.push(href)
  }

  return (
    <div className="fixed inset-y-0 left-0 w-60 bg-[#0a1628] border-r border-gray-800 flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img 
            src={Logo.src}
            alt="TalentScan AI" 
            className="w-8 h-8 object-cover"
          />
          <h1 className="text-white text-lg font-semibold">TalentScan AI</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-xs uppercase tracking-wider"></span>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        </div>

        {/* Main Nav Items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isNewEvaluation = item.id === 'new-evaluations' && user?.role !== 'admin';
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isNewEvaluation || isActive
                  ? 'bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white hover:opacity-90'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
          {user?.userPhoto ? (
            <img 
              src={user.userPhoto} 
              alt={user.fullName || user.email} 
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
              {(user?.fullName || user?.email)?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{user?.fullName || user?.email || 'User'}</p>
            <p className="text-gray-400 text-xs capitalize">{user?.role || 'Guest'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}