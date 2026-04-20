'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validation';
import { LoginFormData, AuthError } from '@/types/auth';
import { useRateLimit } from './useRateLimit';
import { authService } from '@/lib/api';
import { LoginStatus } from '@/lib/api/types';
import { startTrace, getTraceId } from '@/lib/auth/LoginFlowTracer';

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
  
  /**
   * Current login status for verbose feedback
   */
  status: LoginStatus;
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
 *   status,
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
  
  // Login status state for verbose feedback
  const [status, setStatus] = useState<LoginStatus>({ state: 'idle', message: '' });
  
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
    // Also clear status when user starts typing
    if (status.state !== 'idle') {
      setStatus({ state: 'idle', message: '' });
    }
  }, [clearErrors, status.state]);
  
  /**
   * Form submission handler
   * Handles authentication API call, rate limiting, and error handling
   * 
   * Enhanced with:
   * - Trace ID generation for operation correlation
   * - Token storage verification before redirect
   * - Comprehensive logging
   * 
   * Security Note (Requirement 7.2):
   * Password data is NEVER stored in localStorage or sessionStorage.
   * Passwords are only held in memory during form submission and
   * immediately sent to the server via HTTPS.
   * 
   * Requirements: 5.1, 5.3, 5.4, 6.1, 10.1, 10.2
   */
  const onSubmit = useCallback(async (data: LoginFormData, event?: React.BaseSyntheticEvent) => {
    // Defensive: Explicitly prevent default form behavior (Requirements 1.1, 9.1, 9.2)
    if (event) {
      event.preventDefault();
    }

    // Generate trace ID for this login flow
    const traceId = startTrace();
    
    // Clear any previous status
    setStatus({ state: 'idle', message: '' });
    
    // Check rate limit before attempting
    if (isRateLimited) {
      const error: AuthError = {
        type: 'rate_limit',
        message: `Too many attempts. Please wait ${rateLimitRemainingTime} seconds before trying again`,
      };
      setStatus({ state: 'error', message: error.message });
      if (onError) {
        onError(error);
      }
      return;
    }
    
    try {
      // Call authentication API using authService with status callback and trace ID
      const result = await authService.login(
        {
          email: data.email,
          password: data.password
        },
        (newStatus) => {
          // Update status state with callback from authService
          setStatus(newStatus);
        },
        traceId // Pass trace ID for correlation
      );
      
      // Check if login was successful
      if (result.success) {
        // Token is automatically stored and verified by authService
        console.log('Login successful');
        resetRateLimit();
        
        // Wait 500ms to show success message before redirecting (Requirement 7.1, 7.2)
        setTimeout(() => {
          if (onSuccess) {
            onSuccess('/dashboard');
          }
        }, 500);
      } else {
        // Login failed - handle error
        
        // Record attempt for authentication errors
        if (result.error === 'Invalid email or password') {
          recordAttempt();
        }
        
        // Status is already set by the callback
        if (onError) {
          onError({
            type: 'authentication',
            message: result.error || 'Login failed'
          });
        }
      }
    } catch (error) {
      // Handle unexpected errors (Requirement 9.5)
      console.error('[useLoginForm] Unexpected error during login', { 
        error: error instanceof Error ? error.message : String(error),
        traceId 
      });
      const authErrorObj: AuthError = {
        type: 'network',
        message: 'Unable to connect. Please check your connection and try again',
      };
      setStatus({ state: 'error', message: authErrorObj.message });
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
    isRateLimited,
    rateLimitRemainingTime,
    clearFieldError,
    status,
  };
}

export default useLoginForm;
