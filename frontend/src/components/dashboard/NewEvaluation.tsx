'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import AIEvaluationModal from '@/components/modals/AIEvaluationModal';

const NewEvaluation: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="rounded-xl p-8 text-center cursor-pointer transition-all hover:opacity-90 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #17a2b8 0%, #6366f1 50%, #a855f7 100%)'
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {/* Document icon */}
          <div className="mb-3">
            <FileText className="text-white" size={32} strokeWidth={1.5} />
          </div>
          
          {/* Main text */}
          <h3 className="text-lg font-semibold text-white mb-1">
            New Evaluation
          </h3>
          
          {/* Subtitle */}
          <p className="text-white text-opacity-90 text-sm">
            Upload Resume or LinkedIn
          </p>
        </div>
      </div>

      <AIEvaluationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default NewEvaluation;