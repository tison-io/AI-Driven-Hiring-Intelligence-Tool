type Props = {
  description: string;
};

export function JobRole({ description }: Props) {
  return (
    <div className="mt-8 space-y-4 text-secondary-500 leading-relaxed">
      <h2 className="text-lg font-semibold text-secondary-600">About The Role</h2>
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}
