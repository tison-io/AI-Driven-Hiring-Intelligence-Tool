export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-4 bg-gray-700 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-48"></div>
          </div>

          {/* Score cards skeleton */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0f1629] rounded-xl border border-gray-800 p-6 h-64"></div>
            ))}
          </div>

          {/* Content sections skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0f1629] rounded-xl border border-gray-800 p-6 h-48"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
