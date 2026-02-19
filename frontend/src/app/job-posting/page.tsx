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
  isActive: boolean;
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
  const limit = 10;

  useEffect(() => {
    fetchJobPostings();
  }, [page, searchQuery]);

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

  const handleToggleActive = async (id: string) => {
    try {
      await jobPostingsApi.toggleActive(id);
      toast.success('Job status updated!');
      fetchJobPostings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeJobs = jobPostings.filter(job => job.isActive).length;
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

              {/* Loading State */}
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading job postings...</p>
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
                            <button
                              onClick={() => handleToggleActive(job._id)}
                              className="flex items-center gap-2 group"
                            >
                              {job.isActive ? (
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
                          </td>

                          {/* Share Link */}
                          <td className="px-6 py-4">
                            {job.isActive && job.shareableLink ? (
                              <div className="flex items-center gap-2">
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
                              <span className="text-sm text-gray-400">Link Inactive</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => router.push(`/job-posting/${job._id}`)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-400" />
                            </button>
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
