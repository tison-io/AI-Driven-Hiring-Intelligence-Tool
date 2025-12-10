'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success('Reset link sent! Check your email.');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={120}
            className="rounded-[40px]"
          />
        </div>

        {!isSubmitted ? (
          <>
            {/* Heading */}
            <h1 className="text-3xl font-semibold text-gray-900 text-center mb-4">
              Forgot Your Password?
            </h1>

            {/* Description */}
            <p className="text-gray-600 text-center mb-8">
              No problem. Enter the email address associated with your account, and we'll send you a link to reset your password.
            </p>

            {/* Form */}
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
                  placeholder="Enter your work email"
                  disabled={isSubmitting}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white p-3 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center font-medium"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="-ml-1 mr-3" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-[#4F46E5] hover:underline font-medium">
                Back to Log In
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Success Message */}
            <div className="text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-8">
                If an account exists with that email, we've sent a password reset link. Please check your inbox.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white px-6 py-3 rounded-lg hover:opacity-90 font-medium"
              >
                Back to Log In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
