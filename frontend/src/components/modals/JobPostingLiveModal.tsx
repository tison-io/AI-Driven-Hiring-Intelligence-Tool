import { useState } from 'react';
import { CheckCircle, Copy, Eye, Linkedin, Facebook, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface JobPostingLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  shareableLink: string;
}

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function JobPostingLiveModal({ isOpen, onClose, jobTitle, shareableLink }: JobPostingLiveModalProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewPage = () => {
    window.open(shareableLink, '_blank');
  };

  const handleDashboard = () => {
    onClose();
    router.push('/job-posting');
  };

  const socialButtons = [
    { label: 'LinkedIn', icon: <Linkedin className="w-5 h-5 text-[#0A66C2]" />, color: 'hover:border-[#0A66C2]' },
    { label: 'X', icon: <XIcon />, color: 'hover:border-gray-800' },
    { label: 'Facebook', icon: <Facebook className="w-5 h-5 text-[#1877F2]" />, color: 'hover:border-[#1877F2]' },
    { label: 'WhatsApp', icon: <WhatsAppIcon />, color: 'hover:border-[#25D366]' },
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors text-2xl leading-none"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Success Icon */}
        <div className="flex justify-center mb-5 animate-popIn">
          <CheckCircle className="w-14 h-14 text-green-500" strokeWidth={2} />
        </div>

        {/* Title & Subtitle */}
        <h2 id="modal-title" className="text-2xl font-bold text-slate-900 text-center mb-2">
          Job Posting is Live!
        </h2>
        <p className="text-sm text-slate-500 text-center mb-7">
          {jobTitle} is now open for applications.
        </p>

        {/* Share Box */}
        <div className="border-2 border-slate-200 rounded-xl p-5 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Share this link with candidates:
          </p>
          
          {/* Link Input & Copy Button */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={shareableLink.replace('http://localhost:3001', 'talentscan.ai')}
              readOnly
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-600 truncate"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all ${
                copied 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30'
              }`}
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Social Share */}
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-center mb-3">
            Or share directly to:
          </p>
          <div className="grid grid-cols-4 gap-2">
            {socialButtons.map(({ label, icon, color }) => (
              <button
                key={label}
                className={`flex flex-col items-center gap-1.5 border-2 border-slate-200 rounded-lg py-2.5 bg-white hover:bg-slate-50 transition-all hover:-translate-y-0.5 hover:shadow-md ${color}`}
              >
                {icon}
                <span className="text-xs text-slate-600 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* View Page Button */}
        <button
          onClick={handleViewPage}
          className="w-full flex items-center justify-center gap-2 border-2 border-indigo-500 text-indigo-600 rounded-xl py-3 font-semibold hover:bg-indigo-50 transition-colors mb-3"
        >
          <Eye className="w-4 h-4" />
          View Public Page
        </button>

        {/* Dashboard Link */}
        <button
          onClick={handleDashboard}
          className="w-full text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          Go to Dashboard
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-popIn { animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both; }
      `}</style>
    </div>
  );
}
