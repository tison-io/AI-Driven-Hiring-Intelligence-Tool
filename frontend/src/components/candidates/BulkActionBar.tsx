import { CheckCircle, XCircle, Download, X, Clock, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BulkActionBarProps {
  selectedCount: number;
  onShortlist: () => void;
  onReject: () => void;
  onToReview: () => void;
  onHired: () => void;
  onExport: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onShortlist,
  onReject,
  onToReview,
  onHired,
  onExport,
  onClear,
}: BulkActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (selectedCount > 0) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [selectedCount]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed bottom-0 sm:bottom-8 left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 w-full sm:w-fit bg-gray-900 text-white px-3 sm:px-6 py-3 sm:py-4 sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-6 z-50 ${isVisible ? 'animate-slide-up' : 'animate-slide-down'}`}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
        <span className="font-medium text-sm sm:text-base whitespace-nowrap">
          {selectedCount} candidate{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 justify-center">
        <button
          onClick={onToReview}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">To Review</span>
        </button>

        <button
          onClick={onShortlist}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          <CheckCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Shortlist</span>
        </button>

        <button
          onClick={onReject}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          <XCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Reject</span>
        </button>

        <button
          onClick={onHired}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          <UserCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Hired</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>

        <button
          onClick={onClear}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
