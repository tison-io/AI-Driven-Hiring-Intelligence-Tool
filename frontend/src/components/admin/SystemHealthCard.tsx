'use client';

import { CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { SystemHealthCardProps } from '@/types';

export default function SystemHealthCard({ type, title, value, target, status }: SystemHealthCardProps) {
  if (type === 'latency') {
    const isWithinTarget = status === 'within';
    
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          <div className="flex items-center space-x-2">
            {isWithinTarget ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${isWithinTarget ? 'text-green-600' : 'text-red-600'}`}>
              {isWithinTarget ? 'Within Target' : 'Outside Target'}
            </span>
          </div>
        </div>
        
        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-900">{value.toFixed(1)}s</p>
        </div>
        
        <div className="text-sm text-gray-500">
          Target: &lt;{target?.toFixed(1)}s
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="flex items-center gap-3 mb-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-600">
          Monitor
        </span>
      </div>
      
      <a href="/admin/error-logs" className="text-sm text-gray-500 hover:text-gray-700 underline">
        View Error Logs →
      </a>
    </div>
  );
}