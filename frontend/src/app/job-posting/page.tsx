import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import React from 'react'

const page = () => {
  return (
    <ProtectedRoute>
        <Layout>
            <div>page</div>
        </Layout>
    </ProtectedRoute>
  )
}

export default page