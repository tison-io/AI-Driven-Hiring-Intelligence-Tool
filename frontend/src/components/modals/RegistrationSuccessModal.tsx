'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Mail, Clock } from 'lucide-react';

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export default function RegistrationSuccessModal({ 
  isOpen, 
  onClose, 
  email 
}: RegistrationSuccessModalProps) {
  const router = useRouter();

  console.log('RegistrationSuccessModal props:', { isOpen, email });

  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Modal is open, rendering modal');

  const handleContinue = () => {
    console.log('Continue button clicked');
    onClose();
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Registration Successful!
        </h2>

        {/* Email Confirmation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Verification code sent to:
            </span>
          </div>
          <p className="text-blue-800 font-medium break-all ml-8">
            {email}
          </p>
        </div>

        {/* Instructions */}
        <div className="flex items-center gap-3 mb-6 text-gray-600">
          <Clock className="w-5 h-5 text-orange-500" />
          <p className="text-sm">
            Please check your inbox and enter the 6-digit code. 
            <span className="font-medium text-orange-600"> Code expires in 15 minutes.</span>
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#29B1B4] via-[#6A80D9] to-[#AA50FF] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Continue to Verification
        </button>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Didn't receive the email? Check your spam folder or try again in a few minutes.
        </p>
      </div>
    </div>
  );
}