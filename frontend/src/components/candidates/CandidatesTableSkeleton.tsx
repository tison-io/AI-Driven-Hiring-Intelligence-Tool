export default function CandidatesTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Candidate Name
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Target Role
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Experience
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Top Skills
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Role Fit
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Confidence
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-4 px-6">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-gray-200 rounded w-40"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-1">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
