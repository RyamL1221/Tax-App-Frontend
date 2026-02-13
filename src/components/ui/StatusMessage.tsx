import React from 'react';
import { cn } from '@/lib/utils';

export interface StatusMessageProps {
  /**
   * The message text to display
   */
  message: string;
  
  /**
   * The type of message (determines styling and ARIA attributes)
   */
  type: 'success' | 'error' | 'info';
  
  /**
   * Optional callback when user dismisses the message
   */
  onClear?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * StatusMessage displays feedback messages with appropriate styling
 * and accessibility attributes.
 * 
 * Success messages use green styling with aria-live="polite"
 * Error messages use red styling with aria-live="assertive"
 * Info messages use blue styling with aria-live="polite"
 */
export const StatusMessage = React.forwardRef<HTMLDivElement, StatusMessageProps>(
  ({ message, type, onClear, className }, ref) => {
    // Determine ARIA attributes based on message type
    const ariaLive = type === 'error' ? 'assertive' : 'polite';
    const role = type === 'error' ? 'alert' : 'status';

    // Base styles for all status messages
    const baseStyles = 'flex items-start gap-3 p-4 rounded-md border text-sm';

    // Type-specific styles
    const typeStyles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    // Icon styles based on type
    const iconStyles = {
      success: 'text-green-600',
      error: 'text-red-600',
      info: 'text-blue-600'
    };

    // Icon SVGs for each type
    const icons = {
      success: (
        <svg
          className={cn('w-5 h-5 flex-shrink-0', iconStyles.success)}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      ),
      error: (
        <svg
          className={cn('w-5 h-5 flex-shrink-0', iconStyles.error)}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
      ),
      info: (
        <svg
          className={cn('w-5 h-5 flex-shrink-0', iconStyles.info)}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      )
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, typeStyles[type], className)}
        role={role}
        aria-live={ariaLive}
      >
        {/* Icon */}
        {icons[type]}

        {/* Message text */}
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>

        {/* Optional dismiss button */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className={cn(
              'flex-shrink-0 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
              type === 'success' && 'text-green-600 hover:bg-green-100 focus:ring-green-500',
              type === 'error' && 'text-red-600 hover:bg-red-100 focus:ring-red-500',
              type === 'info' && 'text-blue-600 hover:bg-blue-100 focus:ring-blue-500'
            )}
            aria-label="Dismiss message"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

StatusMessage.displayName = 'StatusMessage';
