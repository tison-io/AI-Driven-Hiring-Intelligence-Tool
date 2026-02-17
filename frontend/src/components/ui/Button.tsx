'use client';

import { cn } from "@/utils/helpers";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost" | "gradient";
};

export function Button({ className, variant = "solid", ...rest }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles: Record<string, string> = {
    solid: "bg-secondary-600 text-white hover:bg-secondary-700",
    outline: "border border-secondary-50 bg-white text-secondary-600 hover:bg-secondary-50",
    ghost: "bg-transparent text-secondary-600 hover:bg-secondary-50",
    gradient: "text-white hover:opacity-90",
  };

  return <button {...rest} className={cn(base, styles[variant], className)} />;
}
