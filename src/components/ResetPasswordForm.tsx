'use client';

import React from 'react';
import Link from 'next/link';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { PasswordRequirements } from '@/components/ui/PasswordRequirements';
import { Button } from '@/components/ui/Button';
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';

/**
 * Props for ResetPasswordForm component
 */
export interface ResetPasswordFormProps {
  /**
   * Reset token from URL
   */
  token: string;
  
  /**
   * Callback fired when password reset succeeds
   */
  onSuccess?: () => void;
}

/**
 * ResetPasswordForm Component
 * 
 * Form for setting a new password using a reset token. Displays password
 * inputs with visibility toggles, validation, and handles success/error states.
 * 
 * Features:
 * - Password and confirm password inputs
 * - Password visibility toggles for both fields
 * - Password requirements display
 * - Loading state during submission
 * - Success message with redirect countdown
 * - Error messages for token issues
 * - Link back to login page
 * 
 * Requirements: 4.1, 4.2, 4.4, 4.5, 5.4, 6.1, 6.2, 6.4, 7.2, 10.4, 11.1, 11.2, 11.3
 */
export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    toggleNewPasswordVisibility,
    showConfirmPassword,
    toggleConfirmPasswordVisibility,
    errors,
    isSubmitting,
    isSuccess,
    handleSubmit,
  } = useResetPasswordForm({ token, onSuccess });

  // Success state - show confirmation message with redirect countdown
  if (isSuccess) {
    return (
      <div 
        role="status" 
        aria-live="polite"
        className="text-center space-y-4"
      >
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        {/* Success Message */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Password Reset Successful
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been reset. You can now log in with your new password.
          </p>
        </div>
        
        {/* Redirect Notice */}
        <div className="p-3 rounded-md bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            Redirecting to login page...
          </p>
        </div>
        
        {/* Go to Login Link */}
        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Password Requirements */}
      <PasswordRequirements />
      
      {/* New Password Input */}
      <PasswordInput
        id="new-password"
        value={newPassword}
        onChange={setNewPassword}
        showPassword={showNewPassword}
        onToggleVisibility={toggleNewPasswordVisibility}
        error={errors.newPassword}
        disabled={isSubmitting}
        label="New Password"
        autoComplete="new-password"
      />
      
      {/* Confirm Password Input */}
      <PasswordInput
        id="confirm-password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        showPassword={showConfirmPassword}
        onToggleVisibility={toggleConfirmPasswordVisibility}
        error={errors.confirmPassword}
        disabled={isSubmitting}
        label="Confirm Password"
        autoComplete="new-password"
      />
      
      {/* General Error Message (token errors, network errors) */}
      {errors.general && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 rounded-md bg-red-50 border border-red-200"
        >
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5"
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
            <div>
              <p className="text-sm text-red-800">{errors.general}</p>
              {errors.general.includes('request a new') && (
                <Link
                  href="/forgot-password"
                  className="mt-2 inline-block text-sm font-medium text-red-700 hover:text-red-600 underline"
                >
                  Request a new reset link
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
      </Button>
      
      {/* Back to Login Link */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Back to Login
        </Link>
      </div>
    </form>
  );
}

export default ResetPasswordForm;
