type Props = {
  responsibilities: string[];
};

export function Responsibilities({ responsibilities }: Props) {
  if (!responsibilities || responsibilities.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-3">
      <h3 className="text-base font-semibold text-secondary-600">What You'll Do</h3>
      <ul className="space-y-2 text-secondary-500">
        {responsibilities.map((t) => (
          <li key={t} className="flex gap-3">
            <span className="mt-2 h-2 w-2 rounded-full bg-secondary-500" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
