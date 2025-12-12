'use client';

import React from 'react';
import toast from '@/lib/toast';

export default function ToastDemo() {
  const handleSuccessToast = () => {
    toast.success('Operation completed successfully!');
  };

  const handleErrorToast = () => {
    toast.error('Something went wrong. Please try again.');
  };

  const handleWarningToast = () => {
    toast.warning('Please review your input before proceeding.');
  };

  const handleInfoToast = () => {
    toast.info('New feature available! Check it out.');
  };

  const handleShortlistToast = () => {
    toast.shortlist(true, 'John Doe');
  };

  const handleRemoveShortlistToast = () => {
    toast.shortlist(false, 'John Doe');
  };

  const handleLoadingToast = () => {
    const loadingToast = toast.loading('Processing your request...');
    
    // Simulate async operation
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success('Request processed successfully!');
    }, 3000);
  };

  const handlePromiseToast = () => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Success!') : reject('Failed!');
      }, 2000);
    });

    toast.promise(mockPromise, {
      loading: 'Uploading candidate...',
      success: 'Candidate uploaded successfully!',
      error: 'Failed to upload candidate',
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Toast Notifications Demo</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleSuccessToast}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        >
          Success Toast
        </button>
        
        <button
          onClick={handleErrorToast}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
        >
          Error Toast
        </button>
        
        <button
          onClick={handleWarningToast}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
        >
          Warning Toast
        </button>
        
        <button
          onClick={handleInfoToast}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          Info Toast
        </button>
        
        <button
          onClick={handleShortlistToast}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
        >
          Add to Shortlist
        </button>
        
        <button
          onClick={handleRemoveShortlistToast}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          Remove from Shortlist
        </button>
        
        <button
          onClick={handleLoadingToast}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
        >
          Loading Toast
        </button>
        
        <button
          onClick={handlePromiseToast}
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm"
        >
          Promise Toast
        </button>
      </div>
      
      <button
        onClick={() => toast.dismissAll()}
        className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
      >
        Dismiss All Toasts
      </button>
    </div>
  );
}