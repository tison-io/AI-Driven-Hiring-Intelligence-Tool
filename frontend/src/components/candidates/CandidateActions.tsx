import { Plus, Download } from 'lucide-react'

interface CandidateActionsProps {
  onShortlist?: () => void
  onDownloadReport?: () => void
  onExportCSV?: () => void
}

export default function CandidateActions({ onShortlist, onDownloadReport, onExportCSV }: CandidateActionsProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button 
        onClick={onShortlist}
        className="flex items-center gap-2 px-6 py-3 bg-[#0f1629] border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Add to Shortlist</span>
      </button>
      
      <div className="flex gap-3">
        <button 
          onClick={onDownloadReport}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center gap-2 font-semibold"
        >
          <Download className="w-5 h-5" />
          <span>Download Hiring Report</span>
        </button>
        <button 
          onClick={onExportCSV}
          className="px-6 py-3 bg-[#0f1629] border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
  )
}
