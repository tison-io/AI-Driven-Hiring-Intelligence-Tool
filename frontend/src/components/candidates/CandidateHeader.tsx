'use client'

import { ArrowLeft, Linkedin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CandidateHeaderProps } from '@/types'
import NotificationDropdown from '@/components/notifications/NotificationDropdown'

export default function CandidateHeader({ name, title = 'Candidate', linkedinUrl, onDelete }: CandidateHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => router.push('/candidates')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm md:text-base"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span>Back to Pipeline</span>
        </button>
        <div className="hidden md:block">
          <NotificationDropdown />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">{name}</h1>
          <p className="text-black mb-3 text-sm md:text-base">{title}</p>
          {linkedinUrl && (
            <a 
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn Profile</span>
            </a>
          )}
        </div>
        {onDelete && (
          <button 
            onClick={onDelete}
            className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm md:text-base w-full md:w-auto"
          >
            Hard Delete PII
          </button>
        )}
      </div>
    </div>
  )
}
