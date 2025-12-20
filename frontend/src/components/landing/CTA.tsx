import React from 'react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="bg-[#0D1737] py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          {/* Heading */}
          <h2 className="text-3xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to Transform Your Hiring Process?
          </h2>
          
          {/* Subheading */}
          <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Join smarter recruiting teams using AI to reduce bias and save hours every week.
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="group bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] hover:opacity-90 text-white font-semibold px-8 py-3.5 rounded-lg transition-all w-full sm:w-auto">
              <span className="flex items-center justify-center gap-2">
                Get Started for Free
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
          </div>
          
          {/* Small text below button */}
          <p className="text-gray-500 text-sm mt-6">
            Already have an account? <Link href="/auth/login" className="text-purple-700 hover:text-purple-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}