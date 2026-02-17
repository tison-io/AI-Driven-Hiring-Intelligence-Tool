'use client';

import { cn } from "@/utils/helpers";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-secondary-50 bg-white shadow-sm",
        props.className
      )}
    />
  );
}
