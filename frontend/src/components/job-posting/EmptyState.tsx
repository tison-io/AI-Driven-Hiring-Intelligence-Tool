'use client';

import { Plus } from 'lucide-react';
import Image from 'next/image';

interface EmptyStateProps {
  onCreateClick?: () => void;
}

export default function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="min-h-[calc(100vh-400px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-16 text-center">
          {/* Empty State Illustration */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/empty-job-posting.svg"
              alt="No job postings"
              width={200}
              height={200}
              className="w-48 h-48 md:w-56 md:h-56"
            />
          </div>

          {/* Heading */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to find your next hire?
          </h2>

          {/* Description */}
          <p className="text-base md:text-lg text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">
            You haven't created any job postings yet. Create one now to start receiving AI-evaluated applications.
          </p>

          {/* CTA Button */}
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white rounded-lg font-semibold text-base hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create Your First Job Posting
          </button>
        </div>
      </div>
    </div>
  );
}
