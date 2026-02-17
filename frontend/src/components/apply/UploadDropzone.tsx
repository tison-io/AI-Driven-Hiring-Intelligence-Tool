'use client';

import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { UploadCloud, FileText, X } from "lucide-react";

export function UploadDropzone({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = () => inputRef.current?.click();

  const accept = (f: File) => {
    const ok =
      ["application/pdf",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(f.type) ||
      f.name.toLowerCase().endsWith(".pdf") ||
      f.name.toLowerCase().endsWith(".docx");

    if (!ok) return;
    if (f.size > 10 * 1024 * 1024) return;
    onFile(f);
  };

  return (
    <div className="pt-1">
      <Card
        className="border-dashed p-6 text-center hover:bg-secondary-50 cursor-pointer"
        onClick={pick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) accept(f);
        }}
        role="button"
        tabIndex={0}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-50">
          <UploadCloud className="h-6 w-6 text-secondary-600" />
        </div>

        {!file ? (
          <>
            <p className="mt-3 text-sm font-medium text-secondary-600">
              Drag and drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-secondary-500/80">PDF, DOCX up to 10MB</p>
          </>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary-50 p-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <FileText className="h-5 w-5 text-secondary-600 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-secondary-700 truncate">{file.name}</p>
                <p className="text-xs text-secondary-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="rounded-full p-1 hover:bg-secondary-200 flex-shrink-0 ml-2"
            >
              <X className="h-4 w-4 text-secondary-600" />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) accept(f);
          }}
        />
      </Card>
    </div>
  );
}
