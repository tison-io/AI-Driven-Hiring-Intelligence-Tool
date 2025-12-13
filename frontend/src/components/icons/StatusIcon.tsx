import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StatusIconProps } from '@/types';

const StatusIcon: React.FC<StatusIconProps> = ({ status, size = 20 }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="text-green-500" size={size} />;
    case 'processing':
      return <Clock className="text-blue-500" size={size} />;
    case 'error':
      return <AlertCircle className="text-red-500" size={size} />;
    default:
      return null;
  }
};

export default StatusIcon;