export const getHiringStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    to_review: 'bg-blue-100 text-blue-600 border-blue-300',
    shortlisted: 'bg-purple-100 text-purple-600 border-purple-300',
    rejected: 'bg-red-100 text-red-600 border-red-300',
    hired: 'bg-green-100 text-green-600 border-green-300',
  };
  return styles[status] || styles.to_review;
};

export const getHiringStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    to_review: 'TO REVIEW',
    shortlisted: 'SHORTLISTED',
    rejected: 'REJECTED',
    hired: 'HIRED',
  };
  return labels[status] || 'TO REVIEW';
};

export const formatAppliedDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};
