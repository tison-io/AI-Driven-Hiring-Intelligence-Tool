'use client';

import { Button } from "@/components/ui/Button";

export function SubmitBar({ disabled }: { disabled: boolean }) {
  return (
    <div className="pt-2">
      <Button
        type="submit"
        variant="gradient"
        className="h-12 w-full rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #17a2b8 0%, #6366f1 50%, #a855f7 100%)'
        }}
        disabled={disabled}
      >
        Submit Application
      </Button>
    </div>
  );
}
