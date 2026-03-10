import React from 'react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  /**
   * Current value of the password input
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
   * Whether the password is currently visible
   */
  showPassword: boolean;
  
  /**
   * Callback fired when the visibility toggle button is clicked
   */
  onToggleVisibility: () => void;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * PasswordInput Component
 * 
 * A controlled password input component with visibility toggle, validation display,
 * accessibility features, and responsive styling.
 * 
 * Features:
 * - Password visibility toggle with appropriate icons
 * - ARIA labels and accessibility attributes
 * - Error message display with aria-describedby association
 * - Mobile-first responsive design
 * - Keyboard navigation support
 * - Focus-visible styling for accessibility
 * 
 * @example
 * ```tsx
 * <PasswordInput
 *   value={password}
 *   onChange={setPassword}
 *   showPassword={showPassword}
 *   onToggleVisibility={() => setShowPassword(!showPassword)}
 *   error={errors.password}
 *   label="Password"
 *   disabled={isSubmitting}
 * />
 * ```
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    value, 
    onChange, 
    error, 
    label = 'Password',
    disabled = false,
    showPassword,
    onToggleVisibility,
    className,
    id,
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility
    const inputId = id || 'password-input';
    const errorId = `${inputId}-error`;
    const toggleButtonId = `${inputId}-toggle`;
    const hasError = Boolean(error);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onToggleVisibility();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onToggleVisibility();
      }
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

        {/* Input Field with Toggle Button */}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            aria-label={label}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            aria-required="true"
            autoComplete="current-password"
            className={cn(
              // Base styles
              'w-full px-3 py-2 pr-12 rounded-md border text-base text-gray-900',
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

          {/* Visibility Toggle Button */}
          <button
            id={toggleButtonId}
            type="button"
            onClick={handleToggleClick}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className={cn(
              // Position and sizing
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-2 rounded-md',
              'z-10',
              
              // Touch-friendly sizing (minimum 44x44px)
              'min-w-[44px] min-h-[44px]',
              'md:min-w-[36px] md:min-h-[36px]',
              
              // Hover and focus styles
              'hover:bg-gray-100 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              
              // Disabled state
              disabled && 'cursor-not-allowed opacity-60 hover:bg-transparent'
            )}
          >
            {showPassword ? (
              // Eye-off icon (password is visible, clicking will hide it)
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  style={{ pointerEvents: 'none' }}
                />
              </svg>
            ) : (
              // Eye icon (password is hidden, clicking will show it)
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ pointerEvents: 'none' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  style={{ pointerEvents: 'none' }}
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  style={{ pointerEvents: 'none' }}
                />
              </svg>
            )}
          </button>
        </div>

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

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
