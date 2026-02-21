import { ApplyFooter } from '@/components/apply/ApplyFooter';

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <main className="flex-1">
        {children}
      </main>
      <ApplyFooter />
    </div>
  );
}
