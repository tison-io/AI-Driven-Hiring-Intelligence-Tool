'use client';

import React from 'react';
import { X } from 'lucide-react';
import EvaluationForm from '@/components/forms/EvaluationForm';
import { AIEvaluationModalProps } from '@/types';

export default function AIEvaluationModal({ isOpen, onClose }: AIEvaluationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between p-6 pb-4">
          <h1 className="text-xl font-semibold text-gray-900">
            New AI Evaluation
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </header>

        {/* Content */}
        <div className="px-6 pb-6">
          <EvaluationForm 
            onSuccess={onClose}
            onCancel={onClose}
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
}
