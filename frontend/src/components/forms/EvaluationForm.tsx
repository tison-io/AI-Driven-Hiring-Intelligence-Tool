'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Shield, X, FileText, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from '@/lib/toast';
import { EvaluationFormProps } from '@/types';
import { FEATURES } from '@/config/features';

export default function EvaluationForm({ 
  onSuccess, 
  onCancel, 
  showActions = true 
}: EvaluationFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'linkedin'>('upload');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setResumeFile(file);
      } else {
        toast.error('Please upload a valid file (PDF, DOC, DOCX)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLinkedInClick = () => {
    if (!FEATURES.LINKEDIN_INTEGRATION) {
      setIsLinkedInModalOpen(true);
    } else {
      setActiveTab('linkedin');
    }
  };

  const switchToUpload = () => {
    setIsLinkedInModalOpen(false);
    setActiveTab('upload');
  };

  const closeLinkedInModal = () => {
    setIsLinkedInModalOpen(false);
  };

  const handleRunAnalysis = async () => {
    if (!jobRole.trim()) {
      toast.error('Please enter a target job role');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    if (activeTab === 'upload' && !resumeFile) {
      toast.error('Please upload a resume');
      return;
    }

    if (activeTab === 'linkedin' && !linkedinUrl) {
      toast.error('Please enter a LinkedIn URL');
      return;
    }

    setIsAnalyzing(true);

    try {
      if (activeTab === 'upload' && resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);
        formData.append('jobRole', jobRole);
        formData.append('jobDescription', jobDescription);

        await api.post('/api/candidates/upload-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (activeTab === 'linkedin') {
        await api.post('/api/candidates/linkedin', {
          linkedinUrl,
          jobRole,
          jobDescription,
        });
      }

      toast.success('Candidate submitted successfully! AI analysis started.');
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        router.push('/candidates');
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit candidate');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Job Role */}
      <div>
        <label htmlFor="job-role" className="block text-sm font-medium text-gray-700 mb-2">
          Target Job Role
        </label>
        <input
          id="job-role"
          type="text"
          placeholder="e.g., Backend Engineer"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
          Target Job Role Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="job-description"
          placeholder="Enter job description, required skills, key responsibilities, or specific criteria you're looking for..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Provide details to help AI better evaluate candidates against your specific requirements
        </p>
      </div>

      {/* Candidate Source */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          How would you like to add the candidate?
        </label>
        
        {/* Minimalistic Tab Selection */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload Resume
          </button>
          <button
            type="button"
            onClick={handleLinkedInClick}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'linkedin'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            LinkedIn URL
          </button>
        </div>

        {activeTab === 'upload' && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : resumeFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
            />
            {resumeFile ? (
              <div className="flex flex-col items-center gap-3">
                <FileText size={40} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="w-16 h-16 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title="Click to upload"
                >
                  <Upload size={32} className="text-gray-600" />
                </button>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    Click icon to upload or drop file here
                  </p>
                  <p className="text-xs text-gray-500">
                    Or{' '}
                    <button
                      type="button"
                      onClick={handleBrowseClick}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      browse files
                    </button>
                    {' '}• PDF, DOC, DOCX • Max 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div>
            <input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <aside className="flex gap-3 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <Shield size={20} className="text-cyan-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-cyan-900">
          <strong>Bias & Privacy Disclaimer:</strong> Analysis based solely on professional criteria. PII is processed securely.
        </p>
      </aside>

      {/* LinkedIn Unavailable Modal */}
      {isLinkedInModalOpen && (
        <div className="fixed inset-0 z-[99999]" style={{ position: 'fixed', top: '0px', left: '0px', right: '0px', bottom: '0px', width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 w-full h-full bg-black/50" 
            onClick={closeLinkedInModal}
          />
          
          {/* Modal */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative z-10">
              {/* Icon */}
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Feature Temporarily Unavailable
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 text-center mb-6">
                We're temporarily unable to process LinkedIn profiles. Please upload a resume instead.
              </p>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={closeLinkedInModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={switchToUpload}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Use Resume Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isAnalyzing}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleRunAnalysis}
            className="px-6 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              !jobRole || 
              !jobDescription ||
              isAnalyzing || 
              (activeTab === 'upload' && !resumeFile) || 
              (activeTab === 'linkedin' && !linkedinUrl)
            }
          >
            {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}
