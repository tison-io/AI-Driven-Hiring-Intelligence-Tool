'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'
import { HiringStatus } from '@/types'

interface HiringStatusDropdownProps {
  currentStatus: HiringStatus
  onStatusChange: (newStatus: HiringStatus) => Promise<void>
  disabled?: boolean
}

const statusConfig: Record<HiringStatus, {
  label: string
  icon: any
  color: string
  hoverColor: string
}> = {
  to_review: {
    label: 'To Review',
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    hoverColor: 'hover:bg-gray-200'
  },
  shortlisted: {
    label: 'Shortlisted',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    hoverColor: 'hover:bg-blue-200'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-300',
    hoverColor: 'hover:bg-red-200'
  },
  hired: {
    label: 'Hired',
    icon: UserCheck,
    color: 'bg-green-100 text-green-700 border-green-300',
    hoverColor: 'hover:bg-green-200'
  }
}

export default function HiringStatusDropdown({ 
  currentStatus, 
  onStatusChange,
  disabled = false 
}: HiringStatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const currentConfig = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.to_review
  const CurrentIcon = currentConfig.icon

  const handleStatusChange = async (newStatus: HiringStatus) => {
    if (newStatus === currentStatus || isUpdating) return
    
    setIsUpdating(true)
    try {
      await onStatusChange(newStatus)
      setIsOpen(false)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors ${currentConfig.color} ${!disabled && currentConfig.hoverColor} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <CurrentIcon className="w-4 h-4" />
        <span>{isUpdating ? 'Updating...' : currentConfig.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon
              const isActive = status === currentStatus
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status as HiringStatus)}
                  disabled={isActive}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    isActive 
                      ? 'bg-gray-50 cursor-default opacity-60' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                  <span className="font-medium">{config.label}</span>
                  {isActive && (
                    <span className="ml-auto text-xs text-gray-500">Current</span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
