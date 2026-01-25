import React from 'react';
import { Button } from '@/components/ui/Button';

interface ComponentFallbackProps {
  componentName?: string;
  onRetry?: () => void;
  minimal?: boolean;
}

export const ComponentFallback: React.FC<ComponentFallbackProps> = ({
  componentName = 'component',
  onRetry,
  minimal = false
}) => {
  if (minimal) {
    return (
      <div 
        className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center"
        role="alert"
        aria-live="polite"
      >
        <p className="text-sm text-gray-600">
          Unable to load {componentName}. Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="mb-4">
        <svg 
          className="w-12 h-12 text-gray-400 mx-auto" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-label="Component error icon"
          role="img"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 9v3.75m-9-.75a9 9 0 1118 0 9 9 0 01-18 0zm9 3.75h.008v.008H12v-.008z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {componentName} Unavailable
      </h3>
      <p className="text-gray-600 mb-4">
        We&apos;re having trouble loading this section. This doesn&apos;t affect other parts of the page.
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          size="sm"
          aria-label={`Retry loading ${componentName}`}
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ComponentFallback;