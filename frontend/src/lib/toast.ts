import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Star } from 'lucide-react';

// Custom toast configurations matching the shortlist style
const toastConfig = {
  duration: 4000,
  style: {
    borderRadius: '8px',
    background: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    padding: '12px 16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
  },
};

// Success toast (like shortlist notification)
export const showSuccess = (message: string) => {
  return toast.success(message, {
    ...toastConfig,
    icon: '✅',
    style: {
      ...toastConfig.style,
      borderColor: '#10b981',
      background: '#f0fdf4',
    },
  });
};

// Error toast
export const showError = (message: string) => {
  return toast.error(message, {
    ...toastConfig,
    icon: '❌',
    style: {
      ...toastConfig.style,
      borderColor: '#ef4444',
      background: '#fef2f2',
    },
  });
};

// Warning toast
export const showWarning = (message: string) => {
  return toast(message, {
    ...toastConfig,
    icon: '⚠️',
    style: {
      ...toastConfig.style,
      borderColor: '#f59e0b',
      background: '#fffbeb',
    },
  });
};

// Info toast
export const showInfo = (message: string) => {
  return toast(message, {
    ...toastConfig,
    icon: 'ℹ️',
    style: {
      ...toastConfig.style,
      borderColor: '#3b82f6',
      background: '#eff6ff',
    },
  });
};

// Special shortlist toast (matches existing style)
export const showShortlistSuccess = (isAdded: boolean, candidateName?: string) => {
  const message = isAdded 
    ? candidateName ? `${candidateName} added to shortlist` : 'Added to shortlist'
    : candidateName ? `${candidateName} removed from shortlist` : 'Removed from shortlist';
  
  return toast.success(message, {
    ...toastConfig,
    icon: '⭐',
    style: {
      ...toastConfig.style,
      borderColor: '#10b981',
      background: '#f0fdf4',
    },
  });
};

// Loading toast
export const showLoading = (message: string) => {
  return toast.loading(message, {
    ...toastConfig,
    style: {
      ...toastConfig.style,
      borderColor: '#6b7280',
      background: '#f9fafb',
    },
  });
};

// Dismiss specific toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Promise toast for async operations
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(promise, messages, {
    style: toastConfig.style,
    success: {
      icon: '✅',
      style: {
        ...toastConfig.style,
        borderColor: '#10b981',
        background: '#f0fdf4',
      },
    },
    error: {
      icon: '❌',
      style: {
        ...toastConfig.style,
        borderColor: '#ef4444',
        background: '#fef2f2',
      },
    },
    loading: {
      style: {
        ...toastConfig.style,
        borderColor: '#6b7280',
        background: '#f9fafb',
      },
    },
  });
};

// Export default toast for backward compatibility
export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  shortlist: showShortlistSuccess,
  loading: showLoading,
  promise: showPromiseToast,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
};