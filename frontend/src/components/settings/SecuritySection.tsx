import React from 'react';
import { SecuritySectionProps } from '@/types';

export default function SecuritySection({ onChangePassword }: SecuritySectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-base font-medium text-gray-900 mb-4">
        Security
      </h2>
      
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-900">Password</span>
          <span className="text-sm text-gray-500" aria-label="Hidden password">••••••••••••</span>
        </div>
        <button
          type="button"
          onClick={onChangePassword}
          className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          Change Password
        </button>
      </div>
    </section>
  );
}
