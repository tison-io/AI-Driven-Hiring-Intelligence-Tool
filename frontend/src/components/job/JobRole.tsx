type Props = {
  description: string;
};

export function JobRole({ description }: Props) {
  // Extract first paragraph or first 2-3 sentences as role overview
  const roleOverview = description.split('\n\n')[0] || description.split('\n')[0] || description;
  
  return (
    <div className="mt-8 space-y-4 text-secondary-500 leading-relaxed">
      <h2 className="text-lg font-semibold text-secondary-600">The Role</h2>
      <p>{roleOverview}</p>
    </div>
  );
}
