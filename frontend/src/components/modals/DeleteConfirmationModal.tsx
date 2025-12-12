import React, { useState } from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { DeleteConfirmationModalProps } from '@/types';

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm
}: DeleteConfirmationModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);
  const confirmText = 'DELETE';

  const handleConfirm = () => {
    if (inputValue === confirmText) {
      onConfirm();
      setInputValue('');
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleCancel = () => {
    setInputValue('');
    setError(false);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) setError(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Icon */}
        <div className="flex justify-center pt-6 pb-4">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Title */}
          <h2 
            id="modal-title"
            className="text-xl font-semibold text-gray-900 text-center mb-3"
          >
            Are you absolutely sure?
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center mb-5 leading-relaxed">
            This action cannot be undone. You will permanently lose all of your data, including all candidate profiles, evaluations, and reports.
          </p>

          {/* Confirmation Input */}
          <div className="mb-5">
            <label htmlFor="confirm-input" className="block text-sm text-gray-700 mb-2">
              To confirm, please type{' '}
              <span className="font-semibold text-red-500">{confirmText}</span>
              {' '}in the box below:
            </label>
            <input
              id="confirm-input"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                error
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              placeholder=""
            />
            {error && (
              <div className="flex items-center gap-1 mt-1">
                <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-500">
                  Please type "{confirmText}" to confirm
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!inputValue}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              I understand, delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
