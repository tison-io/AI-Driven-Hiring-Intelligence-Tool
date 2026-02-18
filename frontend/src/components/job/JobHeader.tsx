'use client';

import { Building2 } from "lucide-react";

type Props = {
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  closingDate?: string;
};

export function JobHeader({ title, companyName, location, employmentType, closingDate }: Props) {
  const daysRemaining = closingDate ? Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="space-y-3">
      <h1 className="text-4xl font-semibold tracking-tight text-secondary-700">
        {title}
      </h1>

      <div className="flex flex-wrap items-center gap-2 text-sm text-secondary-500/80">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-primary-50 px-3 py-1">
          <Building2 className="h-4 w-4 text-primary-600" />
          <span className="font-medium text-primary-600">{companyName}</span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <span>📍</span>
          <span>{location}</span>
        </span>
        
        <span className="inline-flex items-center gap-1.5">
          <span>💼</span>
          <span>{employmentType}</span>
        </span>
        
        {daysRemaining && daysRemaining > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span>⏳</span>
            <span>Closes in {daysRemaining} days</span>
          </span>
        )}
      </div>
    </div>
  );
}
