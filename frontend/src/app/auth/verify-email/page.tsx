import VerifyEmailForm from '@/components/forms/VerifyEmailForm';
import PublicRoute from '@/components/auth/PublicRoute';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <PublicRoute>
      <div className="min-h-screen flex flex-col lg:flex-row relative">
        {/* Back to Home Button */}
        <Link 
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 lg:text-gray-400 lg:hover:text-white transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Left Side - Hidden on mobile */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#0F172A] items-center justify-center p-12">
          <div className="text-center text-white max-w-md">
            <div className="mb-8">
              <Image
                src="/images/logo.png"
                alt="Hiring Intelligence"
                width={200}
                height={200}
                className="mx-auto rounded-[75px]"
              />
            </div>
            <h1 className="text-3xl mb-4">Almost There!</h1>
            <p className="text-gray-300 leading-relaxed">
              Enter the 6-digit code we sent to your email to complete your registration and start using our platform.
            </p>
          </div>
        </div>

        {/* Right Side - Full width on mobile */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <VerifyEmailForm />
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}