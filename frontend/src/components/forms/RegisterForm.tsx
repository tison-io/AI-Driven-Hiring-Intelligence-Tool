'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import toast from '@/lib/toast';
import { RegisterFormData, RegisterFormErrors } from '@/types';

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register: registerUser } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    const newErrors: RegisterFormErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await registerUser(formData.email, formData.password);
      // Registration successful - redirect directly to verification
      toast.success('Account created successfully!');
      router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again. ';
      toast.error(errorMessage);
      setErrors({ email: errorMessage });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Create Your Account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
          <input
            data-testid="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <input
              data-testid="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="flex items-start space-x-3">
            <input
              data-testid="terms-checkbox"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <Link href="/terms" className="text-[#6366F1] hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#6366F1] hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
        </div>

        <button
          type="submit"
          data-testid="register-button"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <GoogleAuthButton />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-[#6366F1] hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}