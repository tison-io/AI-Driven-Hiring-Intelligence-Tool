'use client';

import { cn } from "@/utils/helpers";

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-600",
        className
      )}
    >
      {children}
    </span>
  );
}
