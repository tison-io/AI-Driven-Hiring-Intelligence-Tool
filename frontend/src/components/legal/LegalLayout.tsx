'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Printer } from 'lucide-react';

export default function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Back to Home Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[#6366F1] hover:text-[#AA50FF] hover:underline mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo.png"
            alt="TalentScan AI"
            width={80}
            height={80}
            className="rounded-2xl"
          />
        </div>

        {/* Page Title - Responsive */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center">
          {title}
        </h1>

        {/* Gradient Accent Line */}
        <div className="mt-4 mx-auto w-24 h-1 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] rounded-full"></div>

        {/* Last Updated & Print Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          {lastUpdated && (
            <p className="text-center text-sm text-gray-500 italic">
              Last updated: {lastUpdated}
            </p>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-[#29B1B4] hover:via-[#6A80D9] hover:to-[#AA50FF] transition-all print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Content */}
        <div className="mt-12 space-y-10 text-gray-700 leading-8">
          {children}
        </div>

        {/* Footer Links */}
        <div className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <nav className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/legal/privacy" className="hover:text-[#6366F1] hover:underline transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/legal/terms" className="hover:text-[#6366F1] hover:underline transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[#6366F1] hover:underline transition-colors">
              Home
            </Link>
          </nav>
          <p className="mt-4 text-xs text-gray-400">
            © 2025 TalentScan AI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
