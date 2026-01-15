'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import ProfileSection from '@/components/settings/ProfileSection';
import SecuritySection from '@/components/settings/SecuritySection';
import DeleteAccountSection from '@/components/settings/DeleteAccountSection';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    companyName: ''
  });
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        jobTitle: user.jobTitle || '',
        companyName: user.companyName || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (file: File) => {
    setSelectedPhoto(file);
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('jobTitle', formData.jobTitle);
      formDataToSend.append('companyName', formData.companyName);
      
      if (selectedPhoto) {
        formDataToSend.append('userPhoto', selectedPhoto);
      }

      const response = await api.put('/auth/complete-profile', formDataToSend, {
        headers: {
          'Content-Type': undefined
        }
      });
      
      await refreshUser();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await api.put('/auth/change-password', { currentPassword, newPassword });
      
      setSuccess('Password changed successfully');
      setIsPasswordModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');
      await api.delete('/api/privacy/delete-data');
      setIsDeleteModalOpen(false);
      // Logout and redirect after successful deletion
      window.location.href = '/auth/login';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setIsDeleteModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            <header className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Account Settings
              </h1>
              <p className="text-sm text-gray-600">
                Manage your profile information, security settings, and account preferences
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}
              {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-600">{success}</span>
                </div>
              )}
            </header>

            <div className="space-y-6">
              <ProfileSection
                formData={formData}
                userEmail={user?.email}
                userPhoto={photoPreview || user?.userPhoto}
                onInputChange={handleInputChange}
                onPhotoChange={handlePhotoChange}
                onSave={handleSaveProfile}
                memberSince={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                lastLogin={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              />

              <SecuritySection
                onChangePassword={() => setIsPasswordModalOpen(true)}
              />

              <DeleteAccountSection
                onOpenModal={() => setIsDeleteModalOpen(true)}
              />
            </div>

            <ChangePasswordModal
              isOpen={isPasswordModalOpen}
              onClose={() => setIsPasswordModalOpen(false)}
              onSubmit={handleChangePassword}
            />

            <DeleteConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={handleDeleteAccount}
            />
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
