import { Plus, X, Download } from 'lucide-react'
import { CandidateActionsProps } from '@/types'

export default function CandidateActions({ onShortlist, onDownloadReport, isDownloadingReport, isShortlisted }: CandidateActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button 
        onClick={onShortlist}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
          isShortlisted
            ? 'bg-red-50 border border-red-300 text-red-600 hover:bg-red-100'
            : 'bg-white border border-gray-300 text-black hover:bg-gray-200'
        }`}
      >
        {isShortlisted ? (
          <>
            <X className="w-5 h-5" />
            <span>Remove from Shortlist</span>
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            <span>Add to Shortlist</span>
          </>
        )}
      </button>
      
      <div className="flex gap-3">
        <button 
          onClick={onDownloadReport}
          disabled={isDownloadingReport}
          className="px-6 py-3 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>{isDownloadingReport ? 'Downloading...' : 'Download Hiring Report'}</span>
        </button>
      </div>
    </div>
  )
}
