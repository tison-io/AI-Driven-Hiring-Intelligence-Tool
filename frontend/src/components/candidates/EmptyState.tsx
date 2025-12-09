import { Users } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12">
      <div className="text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
        <p className="text-gray-500 mb-6">
          Start by uploading resumes or processing LinkedIn profiles to see candidates here.
        </p>
        <button
          onClick={() => window.location.href = '/upload'}
          className="px-6 py-3 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white rounded-lg hover:opacity-90 transition-all"
        >
          Upload Resume
        </button>
      </div>
    </div>
  )
}
