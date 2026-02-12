"use client";

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import EvaluationForm from '@/components/forms/EvaluationForm';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

export default function EvaluationPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <header className="mb-8 flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">New AI Evaluation</h1>
                <p className="text-gray-600 mt-2">Evaluate candidates using AI-powered analysis</p>
              </div>
              <div className="hidden md:block">
                <NotificationDropdown />
              </div>
            </header>
            
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <EvaluationForm showActions={true} />
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
