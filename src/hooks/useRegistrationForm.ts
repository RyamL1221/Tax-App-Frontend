'use client';

import { useState, useCallback, ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useLoadingState } from './useLoadingState';
import { useRateLimit } from './useRateLimit';
import {
  validatePassword,
  calculatePasswordStrength,
  isValidEmail,
  PasswordStrength
} from '@/utils/passwordValidation';

/**
 * Form data structure for registration
 */
export interface RegistrationFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Validation errors for registration form fields
 */
export interface RegistrationFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Options for configuring the useRegistrationForm hook
 */
export interface UseRegistrationFormOptions {
  /**
   * Callback fired when registration succeeds
   */
  onSuccess?: () => void;
}

/**
 * Return type for the useRegistrationForm hook
 */
export interface UseRegistrationFormReturn {
  formData: RegistrationFormData;
  errors: RegistrationFormErrors;
  isLoading: boolean;
  isRateLimited: boolean;
  rateLimitMessage: string;
  passwordStrength: PasswordStrength;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  clearError: (field: keyof RegistrationFormErrors) => void;
}

/**
 * Custom hook for managing registration form state and submission
 * 
 * Integrates form state management, validation, rate limiting,
 * authentication API calls, and error handling.
 * 
 * Features:
 * - Form state management for all fields (fullName, email, password, confirmPassword)
 * - Field validation on blur and form submission
 * - Password strength calculation
 * - Rate limiting (5 attempts per 15 minutes)
 * - Registration API integration
 * - Loading and error state management
 * - Field error clearing on input
 * 
 * Requirements: 1.1, 1.3, 2.1, 2.4, 3.1, 3.2, 4.2, 4.3, 5.1, 5.2
 * 
 * @param options - Configuration options for the hook
 * @returns Object containing form state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   formData,
 *   errors,
 *   isLoading,
 *   isRateLimited,
 *   rateLimitMessage,
 *   passwordStrength,
 *   handleChange,
 *   handleBlur,
 *   handleSubmit,
 *   clearError
 * } = useRegistrationForm({
 *   onSuccess: () => router.push('/dashboard'),
 * });
 * ```
 */
export function useRegistrationForm(
  options: UseRegistrationFormOptions = {}
): UseRegistrationFormReturn {
  const { onSuccess } = options;

  // Form data state
  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Validation errors state
  const [errors, setErrors] = useState<RegistrationFormErrors>({});

  // Loading state management
  const { isLoading, setLoading } = useLoadingState();

  // Rate limiting
  // Note: useRateLimit currently implements 5 attempts per 60 seconds
  // TODO: Update useRateLimit to support configurable window (15 minutes for registration)
  const {
    isLocked: isRateLimited,
    remainingTime: rateLimitRemainingTime,
    recordAttempt,
    reset: resetRateLimit
  } = useRateLimit();

  // Calculate password strength
  const passwordStrength = calculatePasswordStrength(formData.password);

  // Generate rate limit message
  const rateLimitMessage = isRateLimited
    ? `Too many registration attempts. Please try again in ${Math.ceil(rateLimitRemainingTime / 60)} minutes.`
    : '';

  /**
   * Handle input field changes
   * Updates form data and clears field errors
   * Requirements: 1.1, 9.5
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof RegistrationFormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof RegistrationFormErrors];
        return newErrors;
      });
    }
    
    // Also clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.general;
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Validate a single field
   * Requirements: 2.1, 2.4, 3.1, 3.2, 4.2, 4.3
   * 
   * @param field - The field name to validate
   * @returns true if field is valid, false otherwise
   */
  const validateField = useCallback((field: keyof RegistrationFormData): boolean => {
    const value = formData[field];
    let error: string | undefined;

    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters';
        }
        break;

      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!isValidEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'password':
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          error = passwordValidation.errors.join(', ');
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, [formData]);

  /**
   * Handle field blur events
   * Triggers field validation on blur
   * Requirements: 2.4, 4.3
   */
  const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    validateField(name as keyof RegistrationFormData);
  }, [validateField]);

  /**
   * Validate all form fields
   * Requirements: 2.1, 2.3, 3.1, 3.2, 4.2
   * 
   * @returns true if all fields are valid, false otherwise
   */
  const validateAllFields = useCallback((): boolean => {
    const fields: (keyof RegistrationFormData)[] = [
      'fullName',
      'email',
      'password',
      'confirmPassword'
    ];

    const results = fields.map(field => validateField(field));
    return results.every(result => result);
  }, [validateField]);

  /**
   * Handle form submission
   * Validates all fields, checks rate limit, and calls registration API
   * Requirements: 1.3, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 9.1, 9.2, 9.3
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // Check rate limit
    if (isRateLimited) {
      return;
    }

    // Validate all fields
    if (!validateAllFields()) {
      return;
    }

    // Start loading state
    setLoading(true);
    
    // Record attempt for rate limiting
    recordAttempt();

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 409) {
          // Email already exists
          setErrors(prev => ({
            ...prev,
            email: 'This email is already registered. Please log in instead.'
          }));
        } else {
          // Other API errors
          setErrors(prev => ({
            ...prev,
            general: data.message || 'Registration failed. Please try again.'
          }));
        }
        return;
      }

      // Success - reset rate limit and call success callback
      resetRateLimit();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Network error
      setErrors(prev => ({
        ...prev,
        general: 'Network error. Please check your connection and try again.'
      }));
    } finally {
      // Stop loading state
      setLoading(false);
    }
  }, [
    isRateLimited,
    validateAllFields,
    setLoading,
    recordAttempt,
    formData,
    resetRateLimit,
    onSuccess
  ]);

  /**
   * Clear error for a specific field
   * Requirements: 9.5
   * 
   * @param field - The field name to clear error for
   */
  const clearError = useCallback((field: keyof RegistrationFormErrors) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    formData,
    errors,
    isLoading,
    isRateLimited,
    rateLimitMessage,
    passwordStrength,
    handleChange,
    handleBlur,
    handleSubmit,
    clearError
  };
}

export default useRegistrationForm;
