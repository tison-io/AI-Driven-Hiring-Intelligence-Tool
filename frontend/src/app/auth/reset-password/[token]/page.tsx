'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordFormData>();

  const watchPassword = watch('newPassword', '');
  const watchConfirmPassword = watch('confirmPassword', '');

  const passwordValidations = {
    minLength: watchPassword.length >= 8,
    hasNumber: /\d/.test(watchPassword),
    hasLowercase: /[a-z]/.test(watchPassword),
    hasUppercase: /[A-Z]/.test(watchPassword),
    hasSpecialChar: /[@$!%*?&]/.test(watchPassword),
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const doPasswordsMatch = watchPassword === watchConfirmPassword && watchConfirmPassword !== '';

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!isPasswordValid) {
      toast.error('Password does not meet requirements');
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await authApi.resetPassword(token, data.newPassword);
      setIsSuccess(true);
      toast.success('Password reset successful!');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <Image
              src="/images/reset-success.png"
              alt="Success"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Reset Password Successful!
          </h2>
          <p className="text-gray-600 mb-8">
            Your password has been successfully changed.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white px-8 py-3 rounded-lg hover:opacity-90 font-medium"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

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

        {/* Heading */}
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-4">
          Create a New Password
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-8">
          Your new password must be at least 8 characters long and should include a number, small letter, capital letter, special character.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                {...register('newPassword', {
                  required: 'Password is required',
                })}
                type={showPassword ? 'text' : 'password'}
                disabled={isSubmitting}
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

            {/* Password Requirements */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {passwordValidations.minLength ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidations.minLength ? 'text-green-600' : 'text-gray-600'}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {passwordValidations.hasNumber ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidations.hasNumber ? 'text-green-600' : 'text-gray-600'}>
                  Contains a number
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {passwordValidations.hasLowercase ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidations.hasLowercase ? 'text-green-600' : 'text-gray-600'}>
                  Contains a lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {passwordValidations.hasUppercase ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidations.hasUppercase ? 'text-green-600' : 'text-gray-600'}>
                  Contains an uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {passwordValidations.hasSpecialChar ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
                <span className={passwordValidations.hasSpecialChar ? 'text-green-600' : 'text-gray-600'}>
                  Contains a special character (@$!%*?&)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                disabled={isSubmitting}
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {watchConfirmPassword && !doPasswordsMatch && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
            {doPasswordsMatch && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <Check className="w-4 h-4" /> Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid || !doPasswordsMatch}
            className="w-full bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white p-3 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center font-medium"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" color="white" className="-ml-1 mr-3" />
                Resetting...
              </>
            ) : (
              'Reset Password'
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
      </div>
    </div>
  );
}
