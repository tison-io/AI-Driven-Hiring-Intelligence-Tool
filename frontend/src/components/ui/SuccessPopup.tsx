'use client';

import { useRouter } from 'next/navigation';
import { SuccessPopupProps } from '@/types';

export default function SuccessPopup({
  isOpen,
  onClose,
  title = "Sign up Successful!",
  message = "Your account has been created.. Please wait a moment, we are preparing for you.",
  buttonText = "Go to Dashboard",
  redirectTo = "/dashboard",
  imageSrc = "/images/reg-success.png"
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
        <div className="w-20 h-20 mx-auto mb-6">
          <img src={imageSrc} alt="Success" className="w-full h-full object-contain" />
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