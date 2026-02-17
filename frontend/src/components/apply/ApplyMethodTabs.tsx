'use client';

import { Paperclip, Linkedin } from "lucide-react";
import { cn } from "@/utils/helpers";
import type { ApplyMethod } from "@/stores/useApplyStore";

export function ApplyMethodTabs({
  method,
  setMethod,
}: {
  method: ApplyMethod;
  setMethod: (m: ApplyMethod) => void;
}) {
  const Tab = ({
    active,
    icon,
    label,
    onClick,
  }: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all bg-white",
        active
          ? "text-secondary-600"
          : "text-secondary-500 border border-secondary-50"
      )}
    >
      {active && (
        <span
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #17a2b8 0%, #6366f1 50%, #a855f7 100%)',
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude'
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      <Tab
        active={method === "resume"}
        icon={<Paperclip className="h-4 w-4" />}
        label="Resume"
        onClick={() => setMethod("resume")}
      />
      <Tab
        active={method === "linkedin"}
        icon={<Linkedin className="h-4 w-4" />}
        label="LinkedIn"
        onClick={() => setMethod("linkedin")}
      />
    </div>
  );
}
