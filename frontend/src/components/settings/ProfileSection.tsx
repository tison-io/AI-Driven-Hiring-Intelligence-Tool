import React, { useRef } from 'react';

interface ProfileSectionProps {
  formData: {
    fullName: string;
    jobTitle: string;
    companyName: string;
  };
  userEmail?: string;
  userPhoto?: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoChange: (file: File) => void;
  onSave: () => void;
  memberSince?: string;
  lastLogin?: string;
}

export default function ProfileSection({
  formData,
  userEmail,
  userPhoto,
  onInputChange,
  onPhotoChange,
  onSave,
  memberSince = 'March 15, 2023',
  lastLogin = 'Today at 2:34 PM'
}: ProfileSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      onPhotoChange(file);
    }
  };
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-8">
        {/* Avatar */}
        <aside className="flex flex-col items-center">
          {userPhoto ? (
            <img 
              src={userPhoto} 
              alt={formData.fullName || userEmail || 'User'} 
              className="w-24 h-24 rounded-full object-cover mb-3"
            />
          ) : (
            <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-medium mb-3">
              {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : userEmail ? userEmail.substring(0, 2).toUpperCase() : 'U'}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button 
            type="button" 
            onClick={handlePhotoClick}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Change Photo
          </button>
        </aside>

        {/* Form */}
        <form className="flex-1 space-y-5" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <h2 className="text-sm font-medium text-gray-900">Profile</h2>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-900 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={userEmail || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-900 mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-900 mb-1.5">
              Job Title
            </label>
            <input
              type="text"
              id="jobTitle"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={onInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Member Since
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {memberSince}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">
                Last Login
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                {lastLogin}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-md transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
