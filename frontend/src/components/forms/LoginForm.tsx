'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import { LoginFormData } from '@/types';

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>();

  // Check for OAuth error in URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        'oauth_failed': 'Google sign-in failed. Please try again.',
        'access_denied': 'Access was denied. Please grant permissions.',
        'invalid_scope': 'Invalid permissions requested.',
      };
      
      toast.error(errorMessages[oauthError] || 'Authentication failed. Please try again.');
      
      // Clear the error param from URL
      const params = new URLSearchParams(searchParams.toString());
      params.delete('error');
      const newQuery = params.toString();
      router.replace(newQuery ? `?${newQuery}` : '/auth/login', { scroll: false });
    }
  }, [searchParams, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await login(data.email, data.password);
      toast.success('Login successful!');
     
     if(user){
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (!user?.profileCompleted) {
        router.push('/complete-profile');
      } else {
        router.push('/dashboard');
      }
    }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    }
  };
  

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Email
        </label>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          type="email"
          disabled={isLoading}
          data-testid="email"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            type={showPassword ? 'text' : 'password'}
            disabled={isLoading}
            data-testid="password"
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Link href="/auth/forgot-password" className="text-sm text-[#4F46E5] hover:underline">
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        data-testid="login-button"
        className="w-full bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white p-3 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center font-medium"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" color="white" className="-ml-1 mr-3" />
            Logging in...
          </>
        ) : (
          'Login'
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <GoogleAuthButton />

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-[#4F46E5] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}