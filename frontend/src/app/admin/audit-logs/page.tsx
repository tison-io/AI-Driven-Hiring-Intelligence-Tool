import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import React from 'react'

const AuditLog = () => {
  return (
    <ProtectedRoute>
    <Layout>
     <div>
        <h1>Audit Logs</h1>
     </div>

  </Layout>
  </ProtectedRoute>
  )
}

export default AuditLog