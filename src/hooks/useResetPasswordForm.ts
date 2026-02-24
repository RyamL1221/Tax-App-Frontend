'use client';

import { useState, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';

export interface UseResetPasswordFormOptions {
  token: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface ResetPasswordErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export interface UseResetPasswordFormReturn {
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showNewPassword: boolean;
  toggleNewPasswordVisibility: () => void;
  showConfirmPassword: boolean;
  toggleConfirmPasswordVisibility: () => void;
  errors: ResetPasswordErrors;
  isSubmitting: boolean;
  isSuccess: boolean;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export function useResetPasswordForm(options: UseResetPasswordFormOptions): UseResetPasswordFormReturn {
  const { token, onSuccess, onError } = options;
  const router = useRouter();
  
  const [newPassword, setNewPasswordState] = useState('');
  const [confirmPassword, setConfirmPasswordState] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const setNewPassword = useCallback((value: string) => {
    setNewPasswordState(value);
    if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
  }, [errors.newPassword]);

  const setConfirmPassword = useCallback((value: string) => {
    setConfirmPasswordState(value);
    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
  }, [errors.confirmPassword]);

  const toggleNewPasswordVisibility = useCallback(() => setShowNewPassword(prev => !prev), []);
  const toggleConfirmPasswordVisibility = useCallback(() => setShowConfirmPassword(prev => !prev), []);

  const validateConfirmPassword = useCallback((confirm: string): string | undefined => {
    if (!confirm) return 'Please confirm your password';
    if (confirm !== newPassword) return 'Passwords do not match';
    return undefined;
  }, [newPassword]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    const newPasswordError = validatePassword(newPassword);
    const confirmPasswordError = validateConfirmPassword(confirmPassword);
    
    if (newPasswordError || confirmPasswordError) {
      setErrors({ newPassword: newPasswordError, confirmPassword: confirmPasswordError });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await authService.resetPassword({ token, newPassword });
      setIsSuccess(true);
      onSuccess?.();
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err.status === 400) {
        if (err.message?.toLowerCase().includes('expired')) {
          errorMessage = 'This reset link has expired. Please request a new one.';
        } else if (err.message?.toLowerCase().includes('already been used')) {
          errorMessage = 'This reset link has already been used. Please request a new one.';
        } else if (err.message?.toLowerCase().includes('invalid')) {
          errorMessage = 'This reset link is invalid. Please request a new one.';
        } else {
          errorMessage = err.message || 'Invalid reset token. Please request a new reset link.';
        }
      } else if (err.message === 'Network Error' || !err.status) {
        errorMessage = 'Unable to connect. Please check your internet connection.';
      }
      
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, newPassword, confirmPassword, validateConfirmPassword, onSuccess, onError, router]);

  return {
    newPassword, setNewPassword, confirmPassword, setConfirmPassword,
    showNewPassword, toggleNewPasswordVisibility, showConfirmPassword, toggleConfirmPasswordVisibility,
    errors, isSubmitting, isSuccess, handleSubmit,
  };
}

export default useResetPasswordForm;
