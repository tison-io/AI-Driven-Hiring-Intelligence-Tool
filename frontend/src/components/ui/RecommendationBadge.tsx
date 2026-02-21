interface RecommendationBadgeProps {
  score: number;
  status?: string;
}

export default function RecommendationBadge({ score, status }: RecommendationBadgeProps) {
  if (status === 'failed' || status === 'pending' || status === 'processing') {
    return (
      <span className="flex items-center gap-1 text-gray-500 text-sm font-semibold">
        <span className="text-lg">⏳</span>
        {status === 'failed' ? 'Processing Failed' : 'Processing...'}
      </span>
    );
  }

  if (score >= 85) {
    return (
      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
        <span className="text-lg">✨</span>
        Highly Recommended
      </span>
    );
  }
  
  if (score >= 70) {
    return (
      <span className="flex items-center gap-1 text-orange-600 text-sm font-semibold">
        <span className="text-lg">⚡</span>
        Potential Match
      </span>
    );
  }
  
  if (score >= 20) {
    return (
      <span className="flex items-center gap-1 text-gray-600 text-sm font-semibold">
        <span className="text-lg">📋</span>
        Needs Review
      </span>
    );
  }
  
  if (score > 0) {
    return (
      <span className="flex items-center gap-1 text-red-600 text-sm font-semibold">
        <span className="text-lg">❌</span>
        Not Recommended
      </span>
    );
  }
  
  return null;
}
