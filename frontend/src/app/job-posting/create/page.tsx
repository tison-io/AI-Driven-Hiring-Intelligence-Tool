'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, X } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import Tiptap from '@/components/job-posting/Tiptap';
import { jobPostingsApi } from '@/lib/api';
import toast from '@/lib/toast';

interface FormData {
  title: string;
  location: string;
  description: string;
  requirements: string[];
  salaryMin: string;
  salaryMax: string;
  currency: string;
}

export default function CreateJobPostingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    location: '',
    description: '',
    requirements: [],
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
  });

  const [skillInput, setSkillInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.requirements.includes(skillInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          requirements: [...prev.requirements, skillInput.trim()],
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        status: 'draft',
      };

      // Validate salary data
      const hasPartialSalary = (formData.salaryMin && !formData.salaryMax) || (!formData.salaryMin && formData.salaryMax);
      
      if (hasPartialSalary) {
        toast.warning('Both minimum and maximum salary are required. Salary data will not be saved.');
      }

      if (formData.salaryMin && formData.salaryMax) {
        payload.salary = {
          min: parseFloat(formData.salaryMin),
          max: parseFloat(formData.salaryMax),
          currency: formData.currency,
        };
      }

      await jobPostingsApi.create(payload);
      toast.success('Job saved as draft successfully!');
      router.push('/job-posting');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.description || !formData.location || formData.requirements.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate salary data
    const hasPartialSalary = (formData.salaryMin && !formData.salaryMax) || (!formData.salaryMin && formData.salaryMax);
    
    if (hasPartialSalary) {
      toast.warning('Both minimum and maximum salary are required. Salary data will not be saved.');
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        status: 'active',
      };

      if (formData.salaryMin && formData.salaryMax) {
        const min = parseFloat(formData.salaryMin);
        const max = parseFloat(formData.salaryMax);
        
        if (min < 0 || max < 0) {
          toast.error('Salary values cannot be negative')
          setIsSubmitting(false);
         return;  }
        if (min > max) {
          toast.error('Minimum salary must be less than maximum salary');
          setIsSubmitting(false);
          return;
        }

        payload.salary = {
          min,
          max,
          currency: formData.currency,
        };
      }

      const result = await jobPostingsApi.create(payload);
      toast.success('Job posted successfully!');
      
      // Show shareable link if available
      if (result.shareableLink) {
        console.log('Shareable link:', result.shareableLink);
      }
      
      router.push('/job-posting');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/job-posting');
  };

  const handleDescriptionChange = (html: string) => {
    setFormData((prev) => ({
      ...prev,
      description: html,
    }));
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">Create New Job Posting</h1>
            </div>
          </div>

          {/* Form Container */}
          <div className="max-w-4xl mx-auto px-6 pb-24">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Job Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. San Francisco, CA or Remote"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  
                  <Tiptap
                    content={formData.description}
                    onChange={handleDescriptionChange}
                    placeholder="Describe the role, responsibilities, and team culture..."
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label htmlFor="skillInput" className="block text-sm font-medium text-gray-900 mb-2">
                    Required Skills <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Skills Container */}
                  <div className="border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    {formData.requirements.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    
                    {/* Skill Input */}
                    <input
                      type="text"
                      id="skillInput"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder={formData.requirements.length === 0 ? "Add a skill..." : ""}
                      className="flex-1 min-w-[120px] border-0 focus:outline-none placeholder:text-gray-400 text-sm px-1 py-1"
                    />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1">Press enter to add multiple skills</p>
                </div>

                {/* Salary Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Salary Range (Annual) - Optional
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Min Salary */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        name="salaryMin"
                        value={formData.salaryMin}
                        onChange={handleInputChange}
                        placeholder="Min"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      />
                    </div>

                    {/* Max Salary */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        name="salaryMax"
                        value={formData.salaryMax}
                        onChange={handleInputChange}
                        placeholder="Max"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                      />
                    </div>

                    {/* Currency */}
                    <div className="relative">
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="JPY">JPY</option>
                        <option value="CHF">CHF</option>
                        <option value="CNY">CNY</option>
                        <option value="INR">INR</option>
                        <option value="BRL">BRL</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg z-10">
              <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
