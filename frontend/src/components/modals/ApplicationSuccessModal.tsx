"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/helpers";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SuccessModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div
        className={cn(
          "relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
        )}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
          <CheckCircle2 className="h-7 w-7 text-success-500" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-secondary-700">
          Application Submitted Successfully!
        </h2>

        <p className="mt-3 text-sm leading-6 text-secondary-500">
          We are evaluating your profile against the role requirements. You will receive an
          email with your structured feedback and Role Fit Score shortly.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #17a2b8 0%, #6366f1 50%, #a855f7 100%)'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
