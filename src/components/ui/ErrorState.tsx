import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => (
  <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center flex flex-col items-center">
    <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
    <h4 className="text-sm font-semibold text-red-900 mb-1">{title}</h4>
    <p className="text-xs text-red-700 max-w-md mb-4">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-800 hover:bg-red-100">
        Try Again
      </Button>
    )}
  </div>
);
