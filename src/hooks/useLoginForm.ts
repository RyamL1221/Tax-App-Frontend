'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validation';
import { LoginFormData, AuthError } from '@/types/auth';
import { useRateLimit } from './useRateLimit';
import { authService, isApiError } from '@/lib/api';

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
  onSubmit: (data: LoginFormData, event?: React.BaseSyntheticEvent) => Promise<void>;
  
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
  const onSubmit = useCallback(async (data: LoginFormData, event?: React.BaseSyntheticEvent) => {
    // Defensive: Explicitly prevent default form behavior (Requirements 1.1, 9.1, 9.2)
    console.log('Form submission started');
    if (event) {
      event.preventDefault();
      console.log('Default behavior prevented');
    }
    
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
      // Call authentication API using authService (Requirement 9.3)
      console.log('Calling API client login method');
      await authService.login({
        email: data.email,
        password: data.password
      });
      
      // Token is automatically stored by authService
      // Success - reset rate limit and redirect to dashboard (Requirement 9.4)
      console.log('API call successful');
      resetRateLimit();
      if (onSuccess) {
        onSuccess('/dashboard');
      }
    } catch (error) {
      // Handle API errors (Requirement 9.5)
      console.error('API call failed:', error);
      if (isApiError(error)) {
        // Record attempt for authentication errors (401)
        if (error.status === 401) {
          recordAttempt();
        }
        
        setAuthError(error.message);
        if (onError) {
          onError({
            type: 'authentication',
            message: error.message
          });
        }
      } else {
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
