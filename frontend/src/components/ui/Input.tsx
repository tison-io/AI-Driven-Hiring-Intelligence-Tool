'use client';

import { cn } from "@/utils/helpers";
import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...rest }, ref) => {
    return (
      <input
        ref={ref}
        {...rest}
        className={cn(
          "h-11 w-full rounded-xl border border-secondary-50 bg-white px-4 text-secondary-600 placeholder:text-secondary-500/60",
          "focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300",
          className
        )}
      />
    );
  }
);

Input.displayName = "Input";
