/**
 * Form1099DivClient Component
 * 
 * Main orchestrator component for the 1099-DIV form submission workflow.
 * Manages the state machine for input → preview → approve workflow.
 * 
 * Features:
 * - Mode-based rendering (input vs preview)
 * - Form data preservation during editing
 * - Integration with useForm1099Div hook for workflow logic
 * - Error display and handling with retry functionality
 * - Error boundary for component-level errors
 * - Seamless transitions between modes
 * 
 * Workflow:
 * 1. Input Mode: User enters form data
 * 2. Preview Mode: User reviews generated document
 * 3. Edit: Return to input with preserved data
 * 4. Approve: Reset form and return to input
 * 
 * Requirements: 5.5, 6.4, 6.5, 9.2, 9.4, 10.2
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useForm1099Div } from '@/hooks/useForm1099Div';
import { Form1099DivInput } from '@/components/forms/Form1099DivInput';
import { Form1099DivPreview } from '@/components/forms/Form1099DivPreview';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import { getToken } from '@/lib/api/tokenManager';

export interface Form1099DivClientProps {
  /**
   * JWT authentication token from server (null for server components)
   * If null, the component will retrieve the token from localStorage
   */
  initialToken: string | null;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Form1099DivClient Component
 * 
 * Main client component that orchestrates the 1099-DIV form workflow.
 * Uses the useForm1099Div hook for state management and workflow logic.
 * 
 * The component renders different views based on the current mode:
 * - 'input': Shows the form input component
 * - 'preview': Shows the document preview component
 * 
 * Form data is preserved when switching between modes, allowing users
 * to edit their submission after previewing the generated document.
 * 
 * @example
 * ```tsx
 * // In a server component
 * const token = await getAuthToken();
 * 
 * return <Form1099DivClient initialToken={token} />;
 * ```
 */
export default function Form1099DivClient({ 
  initialToken,
  className 
}: Form1099DivClientProps) {
  // Retrieve JWT token from localStorage if not provided by server
  const [token, setToken] = useState<string | null>(initialToken);
  
  useEffect(() => {
    // Only retrieve from localStorage if token wasn't provided by server
    if (initialToken === null) {
      const storedToken = getToken();
      setToken(storedToken);
    }
  }, [initialToken]);
  
  // Use the custom hook for workflow management
  const {
    mode,
    formData,
    generatedDocument,
    error,
    isSubmitting,
    handleGeneratePreview,
    handleEdit,
    handleApprove,
    handleRetry,
    canRetry,
    showRestorationNotification,
  } = useForm1099Div(token);
  
  // Error handler for ErrorBoundary
  const handleComponentError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('[Form1099DivClient] Component error caught by ErrorBoundary:', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  };

  return (
    <ErrorBoundary onError={handleComponentError}>
      <div className={cn('w-full', className)}>
        {/* Form Data Restoration Notification */}
        {showRestorationNotification && (
          <div 
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-green-400" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  Your form data has been restored
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your previous work has been recovered. You can continue editing or submit the form.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input Mode: Display form for data entry */}
        {mode === 'input' && (
          <Form1099DivInput
            onSubmit={handleGeneratePreview}
            defaultValues={formData || undefined}
            error={error}
            onRetry={canRetry ? handleRetry : undefined}
            isRetrying={isSubmitting && canRetry}
          />
        )}

        {/* Preview Mode: Display generated document with actions */}
        {mode === 'preview' && generatedDocument && (
          <Form1099DivPreview
            document={generatedDocument}
            onEdit={handleEdit}
            onApprove={handleApprove}
          />
        )}

        {/* Loading State Overlay (optional, for better UX) */}
        {isSubmitting && (
          <div
            role="status"
            aria-live="polite"
            aria-label="Generating document"
            className="sr-only"
          >
            Generating document, please wait...
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
