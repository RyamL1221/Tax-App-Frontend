import React from 'react';
import { cn } from '@/lib/utils';

export interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /**
   * Current value of the email input
   */
  value: string;
  
  /**
   * Callback fired when the input value changes
   */
  onChange: (value: string) => void;
  
  /**
   * Error message to display below the input
   */
  error?: string;
  
  /**
   * Label text for the input field
   */
  label?: string;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * EmailInput Component
 * 
 * A controlled email input component with built-in validation display,
 * accessibility features, and responsive styling.
 * 
 * Features:
 * - ARIA labels and accessibility attributes
 * - Error message display with aria-describedby association
 * - Mobile-first responsive design
 * - Keyboard navigation support
 * - Focus-visible styling for accessibility
 * 
 * @example
 * ```tsx
 * <EmailInput
 *   value={email}
 *   onChange={setEmail}
 *   error={errors.email}
 *   label="Email Address"
 *   disabled={isSubmitting}
 * />
 * ```
 */
const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ 
    value, 
    onChange, 
    error, 
    label = 'Email Address',
    disabled = false,
    className,
    id,
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility
    const inputId = id || 'email-input';
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>

        {/* Input Field */}
        <input
          ref={ref}
          id={inputId}
          type="email"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={label}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          aria-required="true"
          autoComplete="email"
          className={cn(
            // Base styles
            'w-full px-3 py-2 rounded-md border text-base',
            'transition-colors duration-200',
            'placeholder:text-gray-400',
            
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            
            // Mobile-first: touch-friendly sizing (minimum 44x44px)
            'min-h-[44px] text-base',
            
            // Tablet and desktop: slightly smaller
            'md:min-h-[40px] md:text-sm',
            
            // State-based styles
            hasError
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 focus-visible:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-blue-500',
            
            // Disabled state
            disabled && 'bg-gray-100 cursor-not-allowed opacity-60'
          )}
          {...props}
        />

        {/* Error Message */}
        {hasError && (
          <div
            id={errorId}
            role="alert"
            aria-live="polite"
            className="mt-1.5 text-sm text-red-600 flex items-start"
          >
            <svg
              className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

EmailInput.displayName = 'EmailInput';

export { EmailInput };
