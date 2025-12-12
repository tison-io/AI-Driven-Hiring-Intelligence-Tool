'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import SuccessPopup from '@/components/ui/SuccessPopup';
import { tokenStorage } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileData } from '@/types';

export default function CompleteProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    jobTitle: '',
    companyName: '',
    userPhoto: null,
    companyLogo: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [userRole, setUserRole] = useState<string>('recruiter');
  const router = useRouter();
  const { refreshUser } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = (type: 'userPhoto' | 'companyLogo', file: File) => {
    setProfileData({ ...profileData, [type]: file });
  };

  const handleRedirect = async (role?: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    await refreshUser();
    const redirectPath = (role || userRole) === 'admin' ? '/admin/dashboard' : '/dashboard';
    router.push(redirectPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('fullName', profileData.fullName);
      formData.append('jobTitle', profileData.jobTitle);
      formData.append('companyName', profileData.companyName);
      
      if (profileData.userPhoto) {
        formData.append('userPhoto', profileData.userPhoto);
      }
      if (profileData.companyLogo) {
        formData.append('companyLogo', profileData.companyLogo);
      }

      const token = tokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/complete-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Profile completion failed');
      }

      const data = await response.json();
      setUserRole(data.role || 'recruiter');
      await refreshUser();
      setShowSuccessPopup(true);
      
      timeoutRef.current = setTimeout(() => {
        handleRedirect(data.role);
      }, 5000);
    } catch (error) {
      console.error('Profile completion failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[670px]">
        <p className="text-[#6B7280] text-center mb-6 mt-8">Final Step: Complete Your Profile</p>
        <h1 className="text-black text-3xl font-bold text-center mb-8">Welcome! Let's get you set up.</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 my-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Job Title (e.g., Technical Recruiter)</label>
            <input
              type="text"
              value={profileData.jobTitle}
              onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={profileData.companyName}
              onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Photo</label>
              <div 
                className="w-32 h-32 mx-auto bg-gray-100 border-2 border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => document.getElementById('userPhoto')?.click()}
              >
                <UserIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload</span>
              </div>
              <input
                id="userPhoto"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('userPhoto', e.target.files[0])}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div 
                className="w-32 h-32 mx-auto bg-gray-100 border-2 border-gray-300 rounded-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => document.getElementById('companyLogo')?.click()}
              >
                <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Upload</span>
              </div>
              <input
                id="companyLogo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('companyLogo', e.target.files[0])}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity mt-12"
          >
            {isLoading ? 'Setting up...' : 'Continue'}
          </button>
        </form>
      </div>
      
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => handleRedirect()}
      />
    </div>
  );
}