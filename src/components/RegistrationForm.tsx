'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { EmailInput } from '@/components/ui/EmailInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface RegistrationFormProps {
  /**
   * Callback fired when registration succeeds
   */
  onSuccess?: () => void;
  
  /**
   * Additional CSS classes for the form container
   */
  className?: string;
}

/**
 * RegistrationForm Component
 * 
 * A complete registration form that integrates all input fields with
 * form validation, submission handling, password strength indication,
 * and error display.
 * 
 * Features:
 * - Full name, email, password, and confirm password input fields
 * - Real-time password strength indicator
 * - Password requirements display
 * - Inline validation error messages
 * - Rate limiting with countdown message
 * - Submit button with loading state
 * - Link to login page
 * - Accessibility features (ARIA labels, keyboard navigation)
 * 
 * Requirements: 1.1, 1.4, 1.5, 2.2, 3.4, 3.5, 4.1, 5.3, 6.1, 6.2, 7.1, 7.2, 7.3, 9.4, 10.1
 * 
 * @example
 * ```tsx
 * <RegistrationForm
 *   onSuccess={() => router.push('/dashboard')}
 * />
 * ```
 */
export function RegistrationForm({ onSuccess, className }: RegistrationFormProps) {
  const {
    formData,
    errors,
    isLoading,
    isRateLimited,
    rateLimitMessage,
    passwordStrength,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useRegistrationForm({ onSuccess });

  // Local state for password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      noValidate
    >
      {/* General Error Message */}
      {errors.general && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-md bg-red-50 border border-red-200"
        >
          <div className="flex items-start">
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
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Full Name Input */}
      <div>
        <label 
          htmlFor="fullName" 
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading || isRateLimited}
          aria-label="Full Name"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          aria-required="true"
          autoComplete="name"
          className={cn(
            'w-full px-3 py-2 rounded-md border text-base',
            'transition-colors duration-200',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'min-h-[44px] text-base',
            'md:min-h-[40px] md:text-sm',
            errors.fullName
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 focus-visible:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-blue-500',
            (isLoading || isRateLimited) && 'bg-gray-100 cursor-not-allowed opacity-60'
          )}
        />
        {errors.fullName && (
          <div
            id="fullName-error"
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
            <span>{errors.fullName}</span>
          </div>
        )}
      </div>

      {/* Email Input */}
      <EmailInput
        id="email"
        value={formData.email}
        onChange={(value) => handleChange({ target: { name: 'email', value } } as any)}
        onBlur={() => handleBlur({ target: { name: 'email' } } as any)}
        error={errors.email}
        disabled={isLoading || isRateLimited}
        label="Email Address"
      />

      {/* Password Input with Strength Indicator and Requirements */}
      <div>
        <PasswordInput
          id="password"
          value={formData.password}
          onChange={(value) => handleChange({ target: { name: 'password', value } } as any)}
          onBlur={() => handleBlur({ target: { name: 'password' } } as any)}
          error={errors.password}
          disabled={isLoading || isRateLimited}
          label="Password"
          showPassword={showPassword}
          onToggleVisibility={() => setShowPassword(!showPassword)}
        />
        
        {/* Show strength indicator and requirements when user starts typing */}
        {formData.password && (
          <>
            <PasswordStrengthIndicator strength={passwordStrength} />
            <PasswordRequirements />
          </>
        )}
      </div>

      {/* Confirm Password Input */}
      <PasswordInput
        id="confirmPassword"
        value={formData.confirmPassword}
        onChange={(value) => handleChange({ target: { name: 'confirmPassword', value } } as any)}
        onBlur={() => handleBlur({ target: { name: 'confirmPassword' } } as any)}
        error={errors.confirmPassword}
        disabled={isLoading || isRateLimited}
        label="Confirm Password"
        showPassword={showConfirmPassword}
        onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
      />

      {/* Rate Limit Message */}
      {isRateLimited && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-md bg-yellow-50 border border-yellow-200"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-800">{rateLimitMessage}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full min-h-[44px] md:min-h-[48px]"
        disabled={isLoading || isRateLimited}
        loading={isLoading}
        loadingText="Creating account..."
      >
        Create Account
      </Button>

      {/* Link to Login Page */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

export default RegistrationForm;
