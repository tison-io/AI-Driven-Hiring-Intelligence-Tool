'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import MetricCard from '@/components/job-posting/MetricCard';
import EmptyState from '@/components/job-posting/EmptyState';
import { Plus, Search, Copy, MoreVertical, Filter, ArrowUpDown } from 'lucide-react';
import { jobPostingsApi } from '@/lib/api';
import toast from '@/lib/toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface JobPosting {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  companyId: string;
  status: 'draft' | 'active' | 'inactive';
  applicationToken: string;
  shareableLink?: string;
  createdAt: string;
  updatedAt: string;
}

export default function JobPostingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    fetchJobPostings();
  }, [page, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      const response = await jobPostingsApi.getAll({
        page,
        limit,
        search: searchQuery || undefined,
      });
      setJobPostings(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await jobPostingsApi.updateStatus(id, newStatus);
      toast.success('Job status updated!');
      fetchJobPostings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      await jobPostingsApi.delete(id);
      toast.success('Job posting deleted successfully!');
      fetchJobPostings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete job posting');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await jobPostingsApi.updateStatus(id, 'active');
      toast.success('Job published successfully!');
      fetchJobPostings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to publish job');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeJobs = jobPostings.filter(job => job.status === 'active').length;
  const draftJobs = jobPostings.filter(job => job.status === 'draft').length;
  const totalApplicants = 0; // TODO: Implement applicant counting

  return (
    <ProtectedRoute>
        <Layout>
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-600">Job Posting</h1>
                <div className="hidden md:block">
                  <NotificationDropdown />
                </div>
              </div>

              {/* Create Job Button */}
              <div className="flex justify-end mb-6">
                <button 
                  onClick={() => router.push('/job-posting/create')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Create Job Posting
                </button>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                  title="Active Jobs"
                  value={activeJobs}
                  percentageChange={0}
                  trend="up"
                  type="candidates"
                />
                <MetricCard
                  title="Total Jobs"
                  value={total}
                  percentageChange={0}
                  trend="up"
                  type="candidates"
                />
                <MetricCard
                  title="Total Applicants"
                  value={totalApplicants}
                  percentageChange={0}
                  trend="up"
                  type="score"
                />
              </div>

              {/* Loading State //needs change to look like a skeleton */}
              {loading ? (
                // <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                //   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>

                // </div>
                <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
               </div>
              ) : jobPostings.length === 0 ? (
                <EmptyState onCreateClick={() => router.push('/job-posting/create')} />
              ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Search and Filters */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by job title, location..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title & Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Share Link
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobPostings.map((job) => (
                        <tr key={job._id} className="hover:bg-gray-50">
                          {/* Job Title & Date */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">
                                Created {formatDate(job.createdAt)}
                              </div>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">{job.location}</span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {job.status === 'draft' ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                DRAFT
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(job._id, job.status)}
                                className="flex items-center gap-2 group"
                              >
                                {job.status === 'active' ? (
                                  <>
                                    <div className="relative inline-flex items-center">
                                      <div className="w-11 h-6 bg-green-500 rounded-full group-hover:bg-green-600 transition-colors"></div>
                                      <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow"></div>
                                    </div>
                                    <span className="text-sm font-medium text-green-600">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="relative inline-flex items-center">
                                      <div className="w-11 h-6 bg-gray-300 rounded-full group-hover:bg-gray-400 transition-colors"></div>
                                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-500">Inactive</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* Share Link */}
                          <td className="px-6 py-4">
                            {job.status === 'active' && job.shareableLink ? (                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                  {job.shareableLink.replace('http://localhost:3001', 'talentscan.ai')}
                                </span>
                                <button 
                                  onClick={() => handleCopyLink(job.shareableLink!)}
                                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Copy className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                {job.status === 'draft' ? 'Not Published' : 'Link Inactive'}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="relative">
                              <button 
                                onClick={() => setOpenDropdown(openDropdown === job._id ? null : job._id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                              </button>

                              {openDropdown === job._id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                  {job.status === 'draft' ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          router.push(`/job-posting/create?id=${job._id}`);
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Posting Details
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDelete(job._id);
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          router.push(`/job-posting/${job._id}`);
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View Details
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDelete(job._id);
                                          setOpenDropdown(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
        </Layout>
    </ProtectedRoute>
  );
}
