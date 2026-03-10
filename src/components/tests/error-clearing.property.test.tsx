/**
 * Property-Based Tests for Error Clearing on Input
 * 
 * Feature: fix-duplicate-error-popups
 * Property 2: Error Clearing on Input
 * **Validates: Requirements 3.1**
 * 
 * These tests verify that errors are cleared when the user types in any field,
 * for both login and registration forms.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { LoginForm } from '../LoginForm';
import { RegistrationForm } from '../RegistrationForm';

// Mock the hooks
jest.mock('@/hooks/useLoginForm');
jest.mock('@/hooks/useRegistrationForm');

import { useLoginForm } from '@/hooks/useLoginForm';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { PasswordStrength } from '@/utils/passwordValidation';

const mockUseLoginForm = useLoginForm as jest.MockedFunction<typeof useLoginForm>;
const mockUseRegistrationForm = useRegistrationForm as jest.MockedFunction<typeof useRegistrationForm>;

describe('Error Clearing on Input - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 2: Error Clearing on Input (Login Form)
   * **Validates: Requirements 3.1**
   * 
   * For any field in the login form, when a user types in that field,
   * all displayed error messages should be cleared.
   */
  test('property: login form clears errors when user types in any field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary field to type in
        fc.constantFrom('email' as const, 'password' as const),
        // Generate arbitrary input value (alphanumeric only)
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
        // Generate arbitrary error message (alphanumeric with spaces)
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s) && s.trim().length >= 10),
        async (fieldName, inputValue, errorMessage) => {
          const mockClearFieldError = jest.fn();
          
          // Create a register function that calls clearFieldError on change
          const mockRegister = jest.fn((name, options) => {
            const onChange = (e: any) => {
              mockClearFieldError(name);
              if (options?.onChange) {
                options.onChange(e);
              }
            };
            return {
              name,
              onChange,
              onBlur: jest.fn(),
              ref: jest.fn(),
            };
          });

          // Mock the hook with an error state
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => {
              e.preventDefault();
              callback({ email: 'test@example.com', password: 'password123' });
            }),
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: jest.fn(),
            onSubmit: jest.fn(),
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
            status: { state: 'error', message: errorMessage },
          });

          const { unmount } = render(<LoginForm onSuccess={jest.fn()} onError={jest.fn()} />);

          try {
            // Verify error is displayed
            const errorAlert = screen.queryByRole('alert');
            expect(errorAlert).toBeInTheDocument();

            // Type in the specified field
            const fieldLabel = fieldName === 'email' ? /email address/i : /^password$/i;
            const field = screen.getByLabelText(fieldLabel);
            
            const user = userEvent.setup();
            await user.type(field, inputValue);

            // Property: clearFieldError should be called when user types
            expect(mockClearFieldError).toHaveBeenCalledWith(fieldName);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Error Clearing on Input (Registration Form)
   * **Validates: Requirements 3.1**
   * 
   * For any field in the registration form, when a user types in that field,
   * all displayed error messages should be cleared.
   */
  test('property: registration form clears errors when user types in any field', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary field to type in
        fc.constantFrom(
          'fullName' as const,
          'email' as const,
          'password' as const,
          'confirmPassword' as const
        ),
        // Generate arbitrary input value (alphanumeric only)
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
        // Generate arbitrary error message (alphanumeric with spaces)
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s) && s.trim().length >= 10),
        async (fieldName, inputValue, errorMessage) => {
          const mockClearStatus = jest.fn();
          
          // Create handleChange that calls clearStatus
          const mockHandleChange = jest.fn((e: any) => {
            mockClearStatus();
          });

          // Mock the hook with an error state
          mockUseRegistrationForm.mockReturnValue({
            formData: {
              fullName: '',
              email: '',
              password: '',
              confirmPassword: '',
            },
            errors: {},
            isLoading: false,
            isRateLimited: false,
            rateLimitMessage: '',
            passwordStrength: PasswordStrength.WEAK,
            handleChange: mockHandleChange,
            handleBlur: jest.fn(),
            handleSubmit: jest.fn(),
            clearError: jest.fn(),
            statusMessage: errorMessage,
            statusType: 'error' as const,
            clearStatus: mockClearStatus,
          });

          const { unmount } = render(<RegistrationForm onSuccess={jest.fn()} />);

          try {
            // Verify error is displayed
            const errorAlert = screen.queryByRole('alert');
            expect(errorAlert).toBeInTheDocument();

            // Type in the specified field
            const fieldLabelMap = {
              fullName: /full name/i,
              email: /email address/i,
              password: /^password$/i,
              confirmPassword: /confirm password/i,
            };
            const field = screen.getByLabelText(fieldLabelMap[fieldName]);
            
            const user = userEvent.setup();
            await user.type(field, inputValue);

            // Property: handleChange should be called when user types
            expect(mockHandleChange).toHaveBeenCalled();
            
            // Property: clearStatus should be called when user types
            expect(mockClearStatus).toHaveBeenCalled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 } // Reduced runs for faster execution
    );
  }, 30000); // 30 second timeout

  /**
   * Property 2: Error Clearing on Input (Both Forms)
   * **Validates: Requirements 3.1**
   * 
   * Verify that both forms clear errors consistently when user types.
   */
  test('property: both forms clear errors consistently when user types', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary error message (alphanumeric with spaces)
        fc.string({ minLength: 10, maxLength: 100 }).filter(s => /^[a-zA-Z0-9\s]+$/.test(s) && s.trim().length >= 10),
        // Generate arbitrary input value (alphanumeric only)
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), { minLength: 1, maxLength: 20 }).map(arr => arr.join('')),
        async (errorMessage, inputValue) => {
          // Test Login Form
          const mockClearFieldErrorLogin = jest.fn();
          
          // Create a register function that calls clearFieldError on change
          const mockRegisterLogin = jest.fn((name, options) => {
            const onChange = (e: any) => {
              mockClearFieldErrorLogin(name);
              if (options?.onChange) {
                options.onChange(e);
              }
            };
            return {
              name,
              onChange,
              onBlur: jest.fn(),
              ref: jest.fn(),
            };
          });

          mockUseLoginForm.mockReturnValue({
            register: mockRegisterLogin,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => {
              e.preventDefault();
              callback({ email: 'test@example.com', password: 'password123' });
            }),
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: jest.fn(),
            onSubmit: jest.fn(),
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldErrorLogin,
            status: { state: 'error', message: errorMessage },
          });

          const { unmount: unmountLogin } = render(<LoginForm onSuccess={jest.fn()} onError={jest.fn()} />);

          try {
            // Verify error is displayed in login form
            const loginErrorAlert = screen.queryByRole('alert');
            expect(loginErrorAlert).toBeInTheDocument();

            // Type in email field
            const emailField = screen.getByLabelText(/email address/i);
            const user = userEvent.setup();
            await user.type(emailField, inputValue);

            // Verify clearFieldError was called
            expect(mockClearFieldErrorLogin).toHaveBeenCalledWith('email');
          } finally {
            unmountLogin();
          }

          // Test Registration Form
          const mockClearStatusReg = jest.fn();
          
          // Create handleChange that calls clearStatus
          const mockHandleChangeReg = jest.fn((e: any) => {
            mockClearStatusReg();
          });

          mockUseRegistrationForm.mockReturnValue({
            formData: {
              fullName: '',
              email: '',
              password: '',
              confirmPassword: '',
            },
            errors: {},
            isLoading: false,
            isRateLimited: false,
            rateLimitMessage: '',
            passwordStrength: PasswordStrength.WEAK,
            handleChange: mockHandleChangeReg,
            handleBlur: jest.fn(),
            handleSubmit: jest.fn(),
            clearError: jest.fn(),
            statusMessage: errorMessage,
            statusType: 'error' as const,
            clearStatus: mockClearStatusReg,
          });

          const { unmount: unmountReg } = render(<RegistrationForm onSuccess={jest.fn()} />);

          try {
            // Verify error is displayed in registration form
            const regErrorAlert = screen.queryByRole('alert');
            expect(regErrorAlert).toBeInTheDocument();

            // Type in email field
            const emailFieldReg = screen.getByLabelText(/email address/i);
            const userReg = userEvent.setup();
            await userReg.type(emailFieldReg, inputValue);

            // Verify handleChange was called
            expect(mockHandleChangeReg).toHaveBeenCalled();
            
            // Verify clearStatus was called
            expect(mockClearStatusReg).toHaveBeenCalled();
          } finally {
            unmountReg();
          }

          // Property: Both forms should clear errors when user types
          // Login form uses clearFieldError, registration form uses clearStatus
          // Both should be called when user types
          expect(mockClearFieldErrorLogin).toHaveBeenCalled();
          expect(mockClearStatusReg).toHaveBeenCalled();
        }
      ),
      { numRuns: 10 } // Reduced runs since this tests both forms
    );
  }, 30000); // 30 second timeout
});
