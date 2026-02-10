'use client';

import React from 'react';
import { AlertTriangle, Users, Eye, X } from 'lucide-react';
import { Notification } from '@/types/notification.types';

interface BiasAlertProps {
  notification: Notification;
  onDismiss?: () => void;
  onViewDetails?: () => void;
}

export const BiasAlertComponent: React.FC<BiasAlertProps> = ({
  notification,
  onDismiss,
  onViewDetails
}) => {
  const biasData = notification.metadata?.biasDetails;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-1">Bias Alert Detected</h4>
            <p className="text-sm text-red-700 mb-3">{notification.content}</p>
            
            {biasData && (
              <div className="space-y-2">
                <div className="text-xs text-red-600">
                  <span className="font-medium">Bias Type:</span> {biasData.type}
                </div>
                <div className="text-xs text-red-600">
                  <span className="font-medium">Confidence:</span> {biasData.confidence}%
                </div>
                {biasData.affectedFields && (
                  <div className="text-xs text-red-600">
                    <span className="font-medium">Affected Fields:</span> {biasData.affectedFields.join(', ')}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </button>
              )}
              <span className="text-xs text-red-500">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface DuplicateCandidateProps {
  notification: Notification;
  onDismiss?: () => void;
  onViewCandidates?: () => void;
  onMergeCandidates?: () => void;
}

export const DuplicateCandidateComponent: React.FC<DuplicateCandidateProps> = ({
  notification,
  onDismiss,
  onViewCandidates,
  onMergeCandidates
}) => {
  const duplicateData = notification.metadata?.duplicateDetails;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800 mb-1">Duplicate Candidate Detected</h4>
            <p className="text-sm text-yellow-700 mb-3">{notification.content}</p>
            
            {duplicateData && (
              <div className="space-y-2">
                <div className="text-xs text-yellow-600">
                  <span className="font-medium">Similarity Score:</span> {duplicateData.similarityScore}%
                </div>
                <div className="text-xs text-yellow-600">
                  <span className="font-medium">Matching Fields:</span> {duplicateData.matchingFields?.join(', ')}
                </div>
                {duplicateData.candidateIds && (
                  <div className="text-xs text-yellow-600">
                    <span className="font-medium">Candidates:</span> {duplicateData.candidateIds.length} profiles
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              {onViewCandidates && (
                <button
                  onClick={onViewCandidates}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-md hover:bg-yellow-200 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View Candidates
                </button>
              )}
              {onMergeCandidates && (
                <button
                  onClick={onMergeCandidates}
                  className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  Merge Profiles
                </button>
              )}
              <span className="text-xs text-yellow-500">
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-400 hover:text-yellow-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};