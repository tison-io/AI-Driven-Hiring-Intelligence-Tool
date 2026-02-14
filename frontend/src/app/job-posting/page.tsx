'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import MetricCard from '@/components/admin/MetricCard';
import EmptyState from '@/components/job-posting/EmptyState';
import { Plus, Search, Copy, MoreVertical, Filter, ArrowUpDown } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  createdDate: string;
  department: string;
  applicants: number;
  newApplicants?: number;
  status: 'active' | 'draft' | 'inactive';
  shareLink?: string;
}

export default function JobPostingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const jobPostings: JobPosting[] = [
    {
      id: '1',
      title: 'Senior Backend Engineer',
      createdDate: 'Oct 24, 2023',
      department: 'Engineering',
      applicants: 42,
      newApplicants: 5,
      status: 'active',
      shareLink: 'talentscan.ai/j8x92m...',
    },
    {
      id: '2',
      title: 'UI/UX Designer (Mobile)',
      createdDate: 'Oct 28, 2023',
      department: 'Design',
      applicants: 0,
      status: 'draft',
    },
    {
      id: '3',
      title: 'Product Manager',
      createdDate: 'Oct 22, 2023',
      department: 'Product',
      applicants: 18,
      newApplicants: 0,
      status: 'active',
      shareLink: 'talentscan.ai/jp92kl...',
    },
    {
      id: '4',
      title: 'Marketing Specialist',
      createdDate: 'Sep 15, 2023',
      department: 'Marketing',
      applicants: 0,
      status: 'inactive',
    },
    {
      id: '5',
      title: 'Lead Data Scientist',
      createdDate: 'Oct 10, 2023',
      department: 'Data',
      applicants: 12,
      newApplicants: 2,
      status: 'active',
      shareLink: 'talentscan.ai/jm33la...',
    },
  ];

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
                  value={12}
                  percentageChange={8}
                  trend="up"
                  type="candidates"
                />
                <MetricCard
                  title="Total Applicants"
                  value={248}
                  percentageChange={15}
                  trend="up"
                  type="candidates"
                />
                <MetricCard
                  title="Average Time to Fill"
                  value="18 days"
                  percentageChange={12}
                  trend="down"
                  type="score"
                />
              </div>

              {/* Job Postings Table */}
              {jobPostings.length === 0 ? (
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
                        placeholder="Search by job title, department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter: All Status
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" />
                        Sort By: Newest
                      </button>
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
                          Applicants
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
                        <tr key={job.id} className="hover:bg-gray-50">
                          {/* Job Title & Date */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-500">
                                Created {job.createdDate} • {job.department}
                              </div>
                            </div>
                          </td>

                          {/* Applicants */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{job.applicants}</span>
                              {job.newApplicants !== undefined && job.newApplicants > 0 && (
                                <span className="text-xs text-green-600 font-medium">+{job.newApplicants} new</span>
                              )}
                              {job.status === 'draft' && (
                                <span className="text-xs text-gray-500">Drafting</span>
                              )}
                              {job.newApplicants === 0 && job.status === 'active' && (
                                <span className="text-xs text-gray-500">0 new</span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            {job.status === 'active' && (
                              <div className="flex items-center gap-2">
                                <div className="relative inline-flex items-center">
                                  <div className="w-11 h-6 bg-green-500 rounded-full"></div>
                                  <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow"></div>
                                </div>
                                <span className="text-sm font-medium text-green-600">Active</span>
                              </div>
                            )}
                            {job.status === 'draft' && (
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                  DRAFT
                                </span>
                              </div>
                            )}
                            {job.status === 'inactive' && (
                              <div className="flex items-center gap-2">
                                <div className="relative inline-flex items-center">
                                  <div className="w-11 h-6 bg-gray-300 rounded-full"></div>
                                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow"></div>
                                </div>
                                <span className="text-sm font-medium text-gray-500">Inactive</span>
                              </div>
                            )}
                          </td>

                          {/* Share Link */}
                          <td className="px-6 py-4">
                            {job.shareLink ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{job.shareLink}</span>
                                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
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
                            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
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
                    Showing 1 to 5 of 5 results
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed" disabled>
                      Previous
                    </button>
                    <button className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed" disabled>
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
