'use client';

import { useState, useCallback, FormEvent } from 'react';
import { authService } from '@/lib/api';

/**
 * Options for configuring the useForgotPasswordForm hook
 */
export interface UseForgotPasswordFormOptions {
  /**
   * Callback fired when password reset request succeeds
   */
  onSuccess?: () => void;
  
  /**
   * Callback fired when password reset request fails
   */
  onError?: (error: string) => void;
}

/**
 * Return type for the useForgotPasswordForm hook
 */
export interface UseForgotPasswordFormReturn {
  /**
   * Current email value
   */
  email: string;
  
  /**
   * Set email value
   */
  setEmail: (value: string) => void;
  
  /**
   * Validation error message for email field
   */
  error: string | undefined;
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting: boolean;
  
  /**
   * Whether the request was successful
   */
  isSuccess: boolean;
  
  /**
   * Whether rate limit is active
   */
  isRateLimited: boolean;
  
  /**
   * Rate limit message to display
   */
  rateLimitMessage: string;
  
  /**
   * Form submission handler
   */
  handleSubmit: (e: FormEvent) => Promise<void>;
}

/**
 * Validates email format
 * 
 * @param value - Email string to validate
 * @returns Error message if invalid, undefined if valid
 */
function validateEmail(value: string): string | undefined {
  if (!value.trim()) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return undefined;
}

/**
 * Custom hook for managing forgot password form state and submission
 * 
 * Features:
 * - Email validation (required, format)
 * - API integration with authService.forgotPassword()
 * - Loading, success, and error state management
 * - Rate limiting handling (429 responses)
 * - User enumeration prevention (always shows success)
 * - Error clearing when user corrects input
 * 
 * Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 7.1, 7.3, 7.4
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing form state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   email,
 *   setEmail,
 *   error,
 *   isSubmitting,
 *   isSuccess,
 *   isRateLimited,
 *   rateLimitMessage,
 *   handleSubmit,
 * } = useForgotPasswordForm({
 *   onSuccess: () => console.log('Reset email sent'),
 *   onError: (error) => console.error(error),
 * });
 * ```
 */
export function useForgotPasswordForm(
  options: UseForgotPasswordFormOptions = {}
): UseForgotPasswordFormReturn {
  const { onSuccess, onError } = options;
  
  // Form state
  const [email, setEmailState] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState('');

  /**
   * Set email value and clear error when user starts typing
   * Requirements: 2.4, 11.5
   */
  const setEmail = useCallback((value: string) => {
    setEmailState(value);
    if (error) {
      setError(undefined);
    }
  }, [error]);

  /**
   * Form submission handler
   * 
   * Validates email, calls API, and handles all response scenarios.
   * Always shows success message to prevent user enumeration (Requirement 1.4, 12.5).
   * 
   * Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 7.1, 7.3, 7.4
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Prevent submission if rate limited
    if (isRateLimited) {
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      await authService.forgotPassword({ email });
      
      // Show success message (Requirement 1.3)
      setIsSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      // Handle rate limiting (Requirements 3.1, 3.2, 3.3)
      if (err.status === 429) {
        setIsRateLimited(true);
        const retryAfter = err.retryAfter || 3600;
        const minutes = Math.ceil(retryAfter / 60);
        setRateLimitMessage(
          `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
        );
        onError?.('Rate limit exceeded');
      } else if (err.message === 'Network Error' || !err.status) {
        // Handle network errors (Requirement 1.5)
        setError('Unable to connect. Please check your internet connection.');
        onError?.('Network error');
      } else {
        // For all other errors, show success to prevent user enumeration (Requirement 1.4, 12.5)
        // This includes 404 (email not found) which the backend may return
        setIsSuccess(true);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isRateLimited, onSuccess, onError]);

  return {
    email,
    setEmail,
    error,
    isSubmitting,
    isSuccess,
    isRateLimited,
    rateLimitMessage,
    handleSubmit,
  };
}

export default useForgotPasswordForm;
