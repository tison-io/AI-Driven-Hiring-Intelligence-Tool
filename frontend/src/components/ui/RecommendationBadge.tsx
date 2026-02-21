interface RecommendationBadgeProps {
  score: number;
}

export default function RecommendationBadge({ score }: RecommendationBadgeProps) {
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
  
  return null;
}
