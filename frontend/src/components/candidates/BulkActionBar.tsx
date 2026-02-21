import { CheckCircle, XCircle, Download, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onShortlist: () => void;
  onReject: () => void;
  onExport: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onShortlist,
  onReject,
  onExport,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 animate-slide-up">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
          {selectedCount}
        </div>
        <span className="font-medium">
          {selectedCount} candidate{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onShortlist}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Shortlist
        </button>

        <button
          onClick={onReject}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={onClear}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
