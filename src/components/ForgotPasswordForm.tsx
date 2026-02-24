'use client';

import React from 'react';
import Link from 'next/link';
import { EmailInput } from '@/components/ui/EmailInput';
import { Button } from '@/components/ui/Button';
import { useForgotPasswordForm } from '@/hooks/useForgotPasswordForm';

export interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const {
    email,
    setEmail,
    error,
    isSubmitting,
    isSuccess,
    isRateLimited,
    rateLimitMessage,
    handleSubmit,
  } = useForgotPasswordForm({ onSuccess });

  if (isSuccess) {
    return (
      <div role="status" aria-live="polite" className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Check Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            If an account exists with this email, you will receive a password reset link shortly.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <EmailInput
        value={email}
        onChange={setEmail}
        error={error}
        disabled={isSubmitting || isRateLimited}
        label="Email Address"
        placeholder="Enter your email address"
      />
      
      {isRateLimited && (
        <div role="alert" aria-live="assertive" className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">{rateLimitMessage}</p>
        </div>
      )}
      
      <Button type="submit" disabled={isSubmitting || isRateLimited} loading={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
      </Button>
      
      <div className="text-center">
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Back to Login
        </Link>
      </div>
    </form>
  );
}

export default ForgotPasswordForm;
