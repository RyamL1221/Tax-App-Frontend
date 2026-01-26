'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validation';
import { LoginFormData, AuthResponse, AuthError } from '@/types/auth';
import { useRateLimit } from './useRateLimit';

/**
 * Options for configuring the useLoginForm hook
 */
export interface UseLoginFormOptions {
  /**
   * Callback fired when authentication succeeds
   */
  onSuccess?: (redirectUrl: string) => void;
  
  /**
   * Callback fired when authentication fails
   */
  onError?: (error: AuthError) => void;
}

/**
 * Return type for the useLoginForm hook
 */
export interface UseLoginFormReturn {
  /**
   * React Hook Form register function for form fields
   */
  register: ReturnType<typeof useForm<LoginFormData>>['register'];
  
  /**
   * React Hook Form handleSubmit wrapper
   */
  handleSubmit: ReturnType<typeof useForm<LoginFormData>>['handleSubmit'];
  
  /**
   * Form validation errors
   */
  errors: ReturnType<typeof useForm<LoginFormData>>['formState']['errors'];
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting: boolean;
  
  /**
   * Whether the password is currently visible
   */
  showPassword: boolean;
  
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility: () => void;
  
  /**
   * Form submission handler
   */
  onSubmit: (data: LoginFormData) => Promise<void>;
  
  /**
   * General authentication error (not field-specific)
   */
  authError: string | null;
  
  /**
   * Whether rate limit is active
   */
  isRateLimited: boolean;
  
  /**
   * Remaining time in seconds until rate limit expires
   */
  rateLimitRemainingTime: number;
  
  /**
   * Clear field errors when user starts typing
   */
  clearFieldError: (field: keyof LoginFormData) => void;
}

/**
 * Custom hook for managing login form state and submission
 * 
 * Integrates React Hook Form with Zod validation, rate limiting,
 * authentication API calls, and error handling.
 * 
 * Features:
 * - Form validation using Zod schema
 * - Password visibility toggle
 * - Rate limiting (5 attempts per 60 seconds)
 * - Authentication API integration
 * - Loading and error state management
 * - Field error clearing on input
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing form state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   register,
 *   handleSubmit,
 *   errors,
 *   isSubmitting,
 *   showPassword,
 *   togglePasswordVisibility,
 *   onSubmit,
 *   authError,
 *   isRateLimited,
 *   rateLimitRemainingTime,
 * } = useLoginForm({
 *   onSuccess: (redirectUrl) => router.push(redirectUrl),
 *   onError: (error) => console.error(error),
 * });
 * ```
 */
export function useLoginForm(options: UseLoginFormOptions = {}): UseLoginFormReturn {
  const { onSuccess, onError } = options;
  
  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
    reValidateMode: 'onChange', // Re-validate on change after first validation
  });
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  
  // General authentication error (not field-specific)
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Rate limiting hook
  const {
    isLocked: isRateLimited,
    remainingTime: rateLimitRemainingTime,
    recordAttempt,
    reset: resetRateLimit,
  } = useRateLimit();
  
  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  
  /**
   * Clear field-specific errors when user starts typing
   */
  const clearFieldError = useCallback((field: keyof LoginFormData) => {
    clearErrors(field);
    // Also clear general auth error when user starts typing
    if (authError) {
      setAuthError(null);
    }
  }, [clearErrors, authError]);
  
  /**
   * Form submission handler
   * Handles authentication API call, rate limiting, and error handling
   * 
   * Security Note (Requirement 7.2):
   * Password data is NEVER stored in localStorage or sessionStorage.
   * Passwords are only held in memory during form submission and
   * immediately sent to the server via HTTPS.
   */
  const onSubmit = useCallback(async (data: LoginFormData) => {
    // Clear any previous auth errors
    setAuthError(null);
    
    // Check rate limit before attempting
    if (isRateLimited) {
      const error: AuthError = {
        type: 'rate_limit',
        message: `Too many attempts. Please wait ${rateLimitRemainingTime} seconds before trying again`,
      };
      setAuthError(error.message);
      if (onError) {
        onError(error);
      }
      return;
    }
    
    try {
      // Call authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      // Parse response
      const result: AuthResponse = await response.json();
      
      if (result.success && result.redirectUrl) {
        // Success - reset rate limit and call success callback
        resetRateLimit();
        if (onSuccess) {
          onSuccess(result.redirectUrl);
        }
      } else if (result.error) {
        // Authentication failed - record attempt and display error
        if (result.error.type === 'authentication') {
          recordAttempt();
        }
        
        setAuthError(result.error.message);
        if (onError) {
          onError(result.error);
        }
      } else {
        // Unexpected response format
        const error: AuthError = {
          type: 'network',
          message: 'Something went wrong. Please try again later',
        };
        setAuthError(error.message);
        if (onError) {
          onError(error);
        }
      }
    } catch (error) {
      // Network error or other exception
      const authErrorObj: AuthError = {
        type: 'network',
        message: 'Unable to connect. Please check your connection and try again',
      };
      setAuthError(authErrorObj.message);
      if (onError) {
        onError(authErrorObj);
      }
    }
  }, [
    isRateLimited,
    rateLimitRemainingTime,
    recordAttempt,
    resetRateLimit,
    onSuccess,
    onError,
  ]);
  
  return {
    register,
    handleSubmit,
    errors,
    isSubmitting,
    showPassword,
    togglePasswordVisibility,
    onSubmit,
    authError,
    isRateLimited,
    rateLimitRemainingTime,
    clearFieldError,
  };
}

export default useLoginForm;
