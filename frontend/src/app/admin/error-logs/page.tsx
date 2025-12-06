import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import React from 'react'

const ErrorLogs = () => {
  return (
    <ProtectedRoute>
    <Layout>
     <div>
        <h1>Error Logs</h1>
     </div>

  </Layout>
  </ProtectedRoute>
  )
}

export default ErrorLogs