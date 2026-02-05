'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Clock, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import toast from '@/lib/toast';
import Image from 'next/image';

export default function VerifyEmailForm() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
      if (!email) {
            setError('Email is missing. Please register again.');
            return;
          }
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await verifyEmail(email, code);
      toast.success('Email verified successfully!');
      router.push('/complete-profile');
    } catch (error: any) {
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Email is missing. Please register again.');
      return;
    }
    setIsResending(true);
    setError('');
    
    try {
      await resendVerificationCode(email);
      toast.success('Verification code sent! Check your email.');
      setTimeLeft(15 * 60);
      setCode('');
    } catch (error: any) {
      setError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-0">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification</h2>
        {/* <p className="text-gray-600 text-sm">
          We've sent a 6-digit code to your email address
        </p> */}
      </div>
      <div className='justify-center flex'>
      <Image
          src="/images/rafiki.svg"
          width={300}
          height={300}
          alt="Email verification"
          />
      </div>

      {/* Email Display */}
      {email && (
        <div className="pt-20 p-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-bold flex items-center justify-center text-lg">Verification Code</h1>
              <p className="text-sm font-medium flex-1 align-middle">A verification code has been sent to <span className='text-blue-700'>{email}</span> . Please check the code to proceed. If you don't receive the email in a few minutes, please check your spam or junk folder</p>
              
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            {timeLeft > 0 ? (
              <>Code expires in <span className="font-medium text-orange-600">{formatTime(timeLeft)}</span></>
            ) : (
              <span className="text-red-600 font-medium">Code has expired</span>
            )}
          </span>
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={isLoading || code.length !== 6 || timeLeft === 0}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      {/* Resend Code */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
        <button
          onClick={handleResendCode}
          disabled={isResending || timeLeft > 14 * 60} // Allow resend after 1 minute
          className="text-[#6366F1] hover:underline font-medium text-sm disabled:text-gray-400 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
        >
          {isResending ? (
            <>
              <LoadingSpinner size="sm" color="primary" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Resend Code
            </>
          )}
        </button>
        {timeLeft > 14 * 60 && (
          <p className="text-xs text-gray-500 mt-1">
            You can request a new code in {formatTime(timeLeft - 14 * 60)}
          </p>
        )}
      </div>

      {/* Back to Login */}
      <p className="text-center text-sm text-gray-600">
        Need to use a different email?{' '}
        <Link href="/auth/register" className="text-[#6366F1] hover:underline font-medium">
          Register Again
        </Link>
      </p>
    </div>
  );
}