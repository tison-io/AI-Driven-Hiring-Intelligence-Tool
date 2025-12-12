'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Link as LinkIcon, Shield, X, FileText } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { EvaluationFormProps } from '@/types';

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
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-3">
            Candidate Source
          </legend>
          
          {/* Tab Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload size={18} />
              Upload Resume
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('linkedin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'linkedin'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LinkIcon size={18} />
              LinkedIn URL
            </button>
          </div>

          {/* Upload Area */}
          {activeTab === 'upload' && (
            <div
              onClick={!resumeFile ? handleBrowseClick : undefined}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                !resumeFile ? 'cursor-pointer' : ''
              } ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : resumeFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
              />
              <div className="flex flex-col items-center gap-3">
                {resumeFile ? (
                  <>
                    <FileText size={32} className="text-green-600" />
                    <p className="text-sm text-gray-900 font-medium">{resumeFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-2"
                    >
                      <X size={16} />
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Drag and drop your resume here, or{' '}
                      <span className="text-blue-500 font-medium hover:text-blue-600">
                        browse
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: PDF, DOC, DOCX
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'linkedin' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </fieldset>
      </div>

      {/* Disclaimer */}
      <aside className="flex gap-3 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <Shield size={20} className="text-cyan-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-cyan-900">
          <strong>Bias & Privacy Disclaimer:</strong> Analysis based solely on professional criteria. PII is processed securely.
        </p>
      </aside>

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
