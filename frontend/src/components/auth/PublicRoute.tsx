'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PublicRouteProps } from '@/types';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (!user.profileCompleted) {
        router.push('/complete-profile');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="md" />
  </div>;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}