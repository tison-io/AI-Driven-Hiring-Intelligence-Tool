'use client';

import { useRouter } from 'next/navigation';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
  redirectTo?: string;
}

export default function SuccessPopup({
  isOpen,
  onClose,
  title = "Sign up Successful!",
  message = "Your account has been created.. Please wait a moment, we are preparing for you.",
  buttonText = "Go to Dashboard",
  redirectTo = "/dashboard"
}: SuccessPopupProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleButtonClick = () => {
    onClose();
    router.push(redirectTo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-[#564287] mb-4">{title}</h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>
        
        <button
          onClick={handleButtonClick}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}