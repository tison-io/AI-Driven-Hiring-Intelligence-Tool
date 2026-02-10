export default function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Generate ID from title for deep linking
  const sectionId = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');

  return (
    <section className="space-y-4 scroll-mt-8" id={sectionId}>
      <h2 className="text-2xl font-semibold text-gray-900">
        {title}
      </h2>
      <div className="space-y-4 text-base">{children}</div>
    </section>
  );
}
