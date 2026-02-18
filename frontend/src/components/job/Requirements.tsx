export function Requirements({ requirements }: { requirements: string[] }) {
  if (!requirements || requirements.length === 0) return null;

  return (
    <div className="mt-8 space-y-3">
      <h3 className="text-base font-semibold text-secondary-600">Requirements</h3>
      <ul className="space-y-2 text-secondary-500">
        {requirements.map((req, index) => (
          <li key={index} className="flex gap-3">
            <span className="mt-2 h-2 w-2 rounded-full bg-secondary-500 flex-shrink-0" />
            <span>{req}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
