export function JobLayout({ 
  left, 
  right 
}: { 
  left: React.ReactNode; 
  right: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <div>{left}</div>
        <div className="lg:sticky lg:top-8 h-fit">{right}</div>
      </div>
    </div>
  );
}
