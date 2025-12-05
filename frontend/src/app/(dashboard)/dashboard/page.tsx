export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Candidates</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Average Score</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Shortlisted</h3>
            <p className="text-3xl font-bold text-purple-600">0</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Candidates</h2>
          <p className="text-gray-500">No candidates yet. Start by uploading resumes or LinkedIn profiles.</p>
        </div>
      </div>
    </div>
  )
}