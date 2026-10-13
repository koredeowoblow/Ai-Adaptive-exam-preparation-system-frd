import * as React from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  message = "We couldn't load this content. Please check your connection and try again.", 
  onRetry 
}) => {
  return (
    <div className="p-8 text-center bg-danger-light rounded-md border border-danger text-danger">
      <h3 className="text-danger mb-4 font-semibold">Error</h3>
      <p className="text-text-muted mb-0 data-[has-retry=true]:mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-6">
          Try Again
        </Button>
      )}
    </div>
  );
};
