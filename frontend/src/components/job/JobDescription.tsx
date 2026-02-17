type Props = {
  description: string;
};

export function JobDescription({ description }: Props) {
  return (
    <div className="mt-8 space-y-4 text-secondary-500 leading-relaxed">
      <h2 className="text-lg font-semibold text-secondary-600">About the Role</h2>
      <p className="whitespace-pre-wrap">{description}</p>
    </div>
  );
}
