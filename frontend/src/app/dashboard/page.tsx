"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import ShortlistedCandidates from '@/components/dashboard/ShortlistedCandidates';
import NewEvaluation from '@/components/dashboard/NewEvaluation';
import { DashboardData } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function mapStatus(backendStatus: string): 'completed' | 'processing' | 'error' {
  const statusMap: Record<string, 'completed' | 'processing' | 'error'> = {
    'completed': 'completed',
    'processing': 'processing',
    'pending': 'processing',
    'failed': 'error'
  };
  return statusMap[backendStatus] || 'processing';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const response = await api.get('/api/dashboard');
        const data = response.data;
        
        setDashboardData({
          userName: user?.fullName || user?.email?.split('@')[0] || 'User',
          stats: [
            {
              title: 'Total Candidates',
              value: data.totalCandidates.toString(),
              change: '',
              trend: 'up'
            },
            {
              title: 'Avg Role Fit Score',
              value: `${data.averageRoleFitScore}%`,
              change: '',
              trend: 'up'
            },
            {
              title: 'Shortlisted',
              value: data.shortlistCount.toString(),
              change: '',
              trend: 'up'
            },
            {
              title: 'Pending Reviews',
              value: data.processingCount.toString(),
              change: '',
              trend: 'down'
            }
          ],
          recentActivity: {
            title: 'Recent Activity',
            activities: data.recentCandidates.map((candidate: any) => ({
              name: candidate.name,
              role: candidate.jobRole,
              time: formatRelativeTime(candidate.createdAt),
              status: mapStatus(candidate.status),
              score: candidate.roleFitScore
            }))
          },
          shortlistedCandidates: data.shortlistedCandidates.map((candidate: any) => ({
            _id: candidate._id,
            name: candidate.name,
            role: candidate.jobRole,
            score: candidate.roleFitScore,
            time: formatRelativeTime(candidate.createdAt)
          }))
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchDashboard();
    }
  }, [user]);

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!dashboardData) return null;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <DashboardHeader userName={dashboardData.userName} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {dashboardData.stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
              ))}
            </div>
            
            <div className="mb-8">
              <RecentActivity {...dashboardData.recentActivity} />
            </div>
            
            <div className="mb-8">
              <ShortlistedCandidates candidates={dashboardData.shortlistedCandidates} />
            </div>
            
            <NewEvaluation />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
