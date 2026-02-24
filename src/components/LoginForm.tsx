'use client';

import React from 'react';
import Link from 'next/link';
import { useLoginForm, UseLoginFormOptions } from '@/hooks/useLoginForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface LoginFormProps extends UseLoginFormOptions {
  /**
   * Additional CSS classes for the form container
   */
  className?: string;
}

/**
 * LoginForm Component
 * 
 * A complete login form that integrates email and password inputs with
 * form validation, submission handling, and error display.
 * 
 * Features:
 * - Email and password input fields with validation
 * - Password visibility toggle
 * - Submit button with loading state
 * - General error message display
 * - Error clearing on field input
 * - Rate limiting support
 * - Forgot password link (navigates to /forgot-password)
 * - Accessibility features (ARIA labels, keyboard navigation)
 * 
 * Requirements:
 * - 1.1: User authentication with email and password
 * - 1.3: Display error messages for failed authentication
 * - 3.1: Disable submit button during submission
 * - 3.2: Prevent additional submissions while processing
 * - 3.3: Re-enable submit button after completion
 * - 3.4: Clear field errors when user types
 * - 4.1-4.4: Password visibility toggle
 * - password-recovery/10.5: Link to forgot password page
 * 
 * @example
 * ```tsx
 * <LoginForm
 *   onSuccess={(redirectUrl) => router.push(redirectUrl)}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */
export function LoginForm({ className, onSuccess, onError }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    togglePasswordVisibility,
    onSubmit,
    isRateLimited,
    rateLimitRemainingTime,
    clearFieldError,
    status,
  } = useLoginForm({ onSuccess, onError });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
      noValidate
    >
      {/* Status Message Display */}
      {status.state !== 'idle' && (
        <div
          role={status.state === 'error' ? 'alert' : 'status'}
          aria-live={status.state === 'error' ? 'assertive' : 'polite'}
          className={cn(
            'p-4 rounded-md border transition-all duration-200',
            status.state === 'authenticating' && 'bg-blue-50 border-blue-200',
            status.state === 'success' && 'bg-green-50 border-green-200',
            status.state === 'error' && 'bg-red-50 border-red-200'
          )}
        >
          <div className="flex items-start">
            {status.state === 'authenticating' && (
              <svg
                className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {status.state === 'success' && (
              <svg
                className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {status.state === 'error' && (
              <svg
                className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
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
            )}
            <p
              className={cn(
                'text-sm',
                status.state === 'authenticating' && 'text-blue-800',
                status.state === 'success' && 'text-green-800',
                status.state === 'error' && 'text-red-800'
              )}
            >
              {status.message}
            </p>
          </div>
        </div>
      )}

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email Address
        </label>
        <input
          {...register('email', {
            onChange: () => clearFieldError('email'),
          })}
          id="email"
          type="email"
          autoComplete="email"
          aria-label="Email Address"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-required="true"
          disabled={isSubmitting || isRateLimited}
          className={cn(
            'w-full px-3 py-2 rounded-md border text-base text-gray-900',
            'transition-colors duration-200',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'min-h-[44px] text-base',
            'md:min-h-[40px] md:text-sm',
            errors.email
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 focus-visible:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-blue-500',
            (isSubmitting || isRateLimited) && 'bg-gray-100 cursor-not-allowed opacity-60'
          )}
        />
        {errors.email && (
          <div
            id="email-error"
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
            <span>{errors.email.message}</span>
          </div>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password', {
              onChange: () => clearFieldError('password'),
            })}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-label="Password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            aria-required="true"
            disabled={isSubmitting || isRateLimited}
            className={cn(
              'w-full px-3 py-2 pr-12 rounded-md border text-base text-gray-900',
              'transition-colors duration-200',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'min-h-[44px] text-base',
              'md:min-h-[40px] md:text-sm',
              errors.password
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 focus-visible:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-blue-500',
              (isSubmitting || isRateLimited) && 'bg-gray-100 cursor-not-allowed opacity-60'
            )}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePasswordVisibility();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                togglePasswordVisibility();
              }
            }}
            disabled={isSubmitting || isRateLimited}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2',
              'p-2 rounded-md',
              'z-10',
              'min-w-[44px] min-h-[44px]',
              'md:min-w-[36px] md:min-h-[36px]',
              'hover:bg-gray-100 transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              (isSubmitting || isRateLimited) && 'cursor-not-allowed opacity-60 hover:bg-transparent'
            )}
          >
            {showPassword ? (
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
        {errors.password && (
          <div
            id="password-error"
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
            <span>{errors.password.message}</span>
          </div>
        )}
        
        {/* Forgot Password Link */}
        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full min-h-[44px] md:min-h-[48px]"
        disabled={isSubmitting || isRateLimited}
        loading={isSubmitting}
        loadingText="Logging in..."
      >
        Sign In
      </Button>

      {/* Rate Limit Message */}
      {isRateLimited && (
        <div
          role="alert"
          aria-live="polite"
          className="text-sm text-gray-600 text-center"
        >
          Too many attempts. Please wait {rateLimitRemainingTime} seconds before trying again.
        </div>
      )}
    </form>
  );
}

export default LoginForm;
