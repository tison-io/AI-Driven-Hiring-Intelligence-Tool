'use client'

import { ArrowLeft, Linkedin } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CandidateHeaderProps {
  name: string
  title: string
  linkedinUrl?: string
  onDelete?: () => void
}

export default function CandidateHeader({ name, title, linkedinUrl, onDelete }: CandidateHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-8">
      <button 
        onClick={() => router.push('/candidates')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Pipeline</span>
      </button>
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">{name}</h1>
          <p className="text-black mb-3">{title}</p>
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
            className="px-4 py-2 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Hard Delete PII
          </button>
        )}
      </div>
    </div>
  )
}
