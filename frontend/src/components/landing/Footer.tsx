"use client"
import Image from "next/image"

export default function Footer() {
    return (
      <footer className="bg-black text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/images/logo1.svg" alt="TalentScan AI Logo" width={32} height={32} />
                <span className="text-white font-semibold text-lg">TalentScan AI</span>
              </div>
              <p className="text-sm leading-relaxed">
                Ethical hiring intelligence powered by AI. Transform your recruitment process with unbiased, data-driven candidate evaluation.
              </p>
            </div>
  
            {/* Product Section */}
            <div className='lg:text-center  '>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#features" className="text-sm hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#ethics" className="text-sm hover:text-white transition-colors">
                    Ethics & Privacy
                  </a>
                </li>
              </ul>
            </div>
  
            {/* Resources Section */}
            <div className='lg:text-center '>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#faq" className="text-sm hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-sm hover:text-white transition-colors">
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a href="" className="text-sm hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
  
            {/* Empty column for spacing on large screens */}
            <div className="hidden lg:block"></div>
          </div>
  
          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-400">
                © 2025 TalentScan AI. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }