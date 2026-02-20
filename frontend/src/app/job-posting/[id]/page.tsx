'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, DollarSign, Users, TrendingUp, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';

// Placeholder data
const applicants = [
  { id: '1', initials: 'AK', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600', name: 'Alex Kim', score: 92, scoreColor: 'text-green-600', date: 'Oct 28, 2023', status: 'SHORTLISTED', statusColor: 'text-purple-600' },
  { id: '2', initials: 'MR', bgColor: 'bg-pink-100', textColor: 'text-pink-600', name: 'Maria Rodriguez', score: 88, scoreColor: 'text-green-600', date: 'Oct 27, 2023', status: 'SHORTLISTED', statusColor: 'text-purple-600' },
  { id: '3', initials: 'JS', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', name: 'James Smith', score: 74, scoreColor: 'text-orange-600', date: 'Oct 26, 2023', status: 'TO REVIEW', statusColor: 'text-blue-600' },
];

const skills = ['Python', 'SQL', 'AWS', 'Django'];

export default function JobPostingDetailPage() {
  const router = useRouter();
  const [activeRow, setActiveRow] = useState<string | null>(null);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-gray-50 p-8">
          {/* Back Link */}
          <button
            onClick={() => router.push('/job-posting')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Job Postings
          </button>

          {/* Page Header */}
          <div className="flex items-center gap-3 mb-7">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Senior Backend Engineer</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200">
              Active
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-indigo-600" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">Total Applicants</div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">42</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-600" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">Avg. Role Fit Score</div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">84%</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium mb-1">Days Open</div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight">12</div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 mb-5">
            {/* Applicants Table */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-slate-900">Recent Applicants</h2>
                <button className="flex items-center gap-1 text-sm text-indigo-600 font-semibold hover:opacity-75 transition-opacity">
                  View Pipeline
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-[2fr_1.2fr_1.4fr_1fr] gap-4 px-2 pb-2 border-b border-slate-100 mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Name</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Fit Score</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied Date</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
              </div>

              {/* Table Rows */}
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  onClick={() => setActiveRow(activeRow === applicant.id ? null : applicant.id)}
                  className={`grid grid-cols-[2fr_1.2fr_1.4fr_1fr] gap-4 items-center px-2 py-3 rounded-lg cursor-pointer transition-colors ${
                    activeRow === applicant.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 ${applicant.bgColor} ${applicant.textColor} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {applicant.initials}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{applicant.name}</span>
                  </div>
                  <span className={`text-base font-bold ${applicant.scoreColor}`}>{applicant.score}</span>
                  <span className="text-sm text-slate-500">{applicant.date}</span>
                  <span className={`text-xs font-bold tracking-wide ${applicant.statusColor}`}>{applicant.status}</span>
                </div>
              ))}
            </div>

            {/* Job Summary Sidebar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4">Job Summary</h2>

              <div className="flex items-start gap-2.5 mb-3.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Location</div>
                  <div className="text-sm font-semibold text-slate-800">Remote (Global)</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 mb-4">
                <DollarSign className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Salary Range</div>
                  <div className="text-sm font-semibold text-slate-800">$140k – $180k</div>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5 mt-4">Top Required Skills</div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Match Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm flex gap-4 border-l-4 border-indigo-400">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">AI Match Summary</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                This job posting is attracting highly technical profiles with strong backgrounds in distributed
                systems and cloud infrastructure. The average candidate demonstrates 8+ years of experience in
                Python environments. Why it's working: The remote flexibility and competitive compensation range
                at the top end of the market are the primary drivers for 90th percentile candidates currently
                in the pipeline.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
