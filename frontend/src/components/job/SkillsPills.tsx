type Props = {
  skills: string[];
};

export function SkillsPills({ skills }: Props) {
  if (!skills || skills.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-3">
      <h3 className="text-base font-semibold text-secondary-600">Required Skills</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <span
            key={s}
            className="px-3 py-1 rounded-full text-sm font-medium text-gray-900"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
