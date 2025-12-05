import RegisterForm from '@/components/forms/RegisterForm';
import PublicRoute from '@/components/auth/PublicRoute';

export default function RegisterPage() {
  return (
    <PublicRoute>
      <div className="min-h-screen flex">
        {/* Left Side */}
        <div className="flex-1 bg-gradient-to-b from-[#0A1628] to-[#1A2B42] flex flex-col items-center justify-center px-12">
          <div className="w-48 h-48 bg-gray-300 rounded-[60px] mb-8"></div>
          <h1 className="text-white text-4xl font-medium text-center mb-4">
            The Future of Unbiased Hiring
          </h1>
          <p className="text-white text-center text-lg opacity-90 max-w-md">
            Get started in seconds and revolutionize your recruitment process with AI-powered candidate evaluation.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex-1 bg-white flex items-center justify-center px-12">
          <div className="w-full max-w-md">
            <RegisterForm />
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}