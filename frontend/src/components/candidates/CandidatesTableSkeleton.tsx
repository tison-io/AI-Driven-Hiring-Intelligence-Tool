export default function CandidatesTableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Candidate Name
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Target Role
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Experience
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Top Skills
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Role Fit
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Confidence
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-3 lg:px-4 xl:px-6 text-xs xl:text-sm font-bold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="animate-pulse">
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="h-4 bg-gray-200 rounded w-24 xl:w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 xl:w-40"></div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="h-4 bg-gray-200 rounded w-28 xl:w-36"></div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="h-4 bg-gray-200 rounded w-12 xl:w-16"></div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="flex gap-1">
                    <div className="h-6 bg-gray-200 rounded w-14"></div>
                    <div className="h-6 bg-gray-200 rounded w-14"></div>
                    <div className="h-6 bg-gray-200 rounded w-14"></div>
                  </div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="h-6 bg-gray-200 rounded-full w-10 xl:w-12"></div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="h-4 bg-gray-200 rounded w-10 xl:w-14"></div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="h-6 bg-gray-200 rounded-full w-16 xl:w-20"></div>
                </td>
                <td className="py-3 px-3 lg:px-4 xl:px-6">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
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
