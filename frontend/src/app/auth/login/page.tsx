import LoginForm from '@/components/forms/LoginForm';
import PublicRoute from '@/components/auth/PublicRoute';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="min-h-screen flex relative">
        {/* Back to Home Button */}
        <Link 
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 lg:text-gray-400 lg:hover:text-white transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        {/* Left Side */}
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
            <h1 className="text-3xl mb-4">Welcome Back.</h1>
            <h1 className="text-3xl mb-6">Let's Find Your Next Great Hire.</h1>
            <p className="text-gray-300 leading-relaxed">
              Access your candidate pipeline, review AI-driven insights, and continue building your dream team.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            <h2 className="text-2xl font-medium text-gray-900 mb-8">
              Log In to Your Account
            </h2>
            <LoginForm />
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}