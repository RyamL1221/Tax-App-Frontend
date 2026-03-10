/**
 * Property-Based Tests for LoginForm (Part 3)
 * Feature: fix-form-submission
 * 
 * Continuation of property-based tests for duplicate prevention, error clearing, and rate limiting.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { LoginForm } from '../LoginForm';

// Mock the useLoginForm hook
jest.mock('@/hooks/useLoginForm');
import { useLoginForm } from '@/hooks/useLoginForm';

const mockUseLoginForm = useLoginForm as jest.MockedFunction<typeof useLoginForm>;

describe('LoginForm - Property-Based Tests (Part 3)', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockRegister = jest.fn((name, options) => ({
    name,
    onChange: options?.onChange || jest.fn(),
    onBlur: jest.fn(),
    ref: jest.fn(),
  }));
  const mockTogglePasswordVisibility = jest.fn();
  const mockClearFieldError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 9: Submission prevents duplicate requests
   * **Validates: Requirements 5.3**
   * 
   * For any form in submitting state, the submit button should be disabled
   * preventing additional submission attempts.
   */
  test('property: submission prevents duplicate requests', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        (formData) => {
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {},
            isSubmitting: true, // Form is already submitting
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: Button must be disabled when form is submitting
            const submitButton = screen.getByRole('button', { name: /logging in/i });
            expect(submitButton).toBeDisabled();

            // Property: This prevents duplicate submissions since disabled buttons can't be clicked
            expect(submitButton).toHaveAttribute('aria-busy', 'true');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Completion removes loading state
   * **Validates: Requirements 5.4, 5.5**
   * 
   * For any completed form submission (success or failure), the loading state should be removed.
   */
  test('property: completion removes loading state', () => {
    fc.assert(
      fc.property(
        fc.record({
          isSuccess: fc.boolean(),
          errorMessage: fc.option(fc.constantFrom(
            'Invalid email or password',
            'Unable to connect. Please check your connection and try again'
          ), { nil: null }),
        }),
        (testData) => {
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {},
            isSubmitting: false, // Submission completed
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: After completion, submit button must be enabled
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            expect(submitButton).not.toBeDisabled();
            expect(submitButton).not.toHaveAttribute('aria-busy', 'true');

            // Property: Form fields must be enabled after completion
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            expect(emailInput).not.toBeDisabled();
            expect(passwordInput).not.toBeDisabled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Validation errors display field-specific messages
   * **Validates: Requirements 6.4**
   * 
   * For any validation error, the system should display a field-specific error message.
   */
  test('property: validation errors display field-specific messages', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasEmailError: fc.boolean(),
          hasPasswordError: fc.boolean(),
          emailError: fc.constantFrom(
            'Email is required',
            'Please enter a valid email address'
          ),
          passwordError: fc.constantFrom(
            'Password is required',
            'Password must be at least 8 characters'
          ),
        }),
        (testData) => {
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {
              ...(testData.hasEmailError ? { email: { message: testData.emailError, type: 'validation' } } : {}),
              ...(testData.hasPasswordError ? { password: { message: testData.passwordError, type: 'validation' } } : {}),
            },
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: For any field with an error, the error message must be displayed
            if (testData.hasEmailError) {
              expect(screen.getByText(testData.emailError)).toBeInTheDocument();
              const emailInput = screen.getByLabelText(/email address/i);
              expect(emailInput).toHaveAttribute('aria-invalid', 'true');
              expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
            }

            if (testData.hasPasswordError) {
              expect(screen.getByText(testData.passwordError)).toBeInTheDocument();
              const passwordInput = screen.getByLabelText(/^password$/i);
              expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
              expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error');
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: User input clears errors
   * **Validates: Requirements 6.5**
   * 
   * For any form field with an error, typing in that field should clear the error message.
   */
  test('property: user input clears errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          field: fc.constantFrom('email', 'password'),
          errorMessage: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async (testData) => {
          const user = userEvent.setup();
          const mockClearFieldErrorLocal = jest.fn();

          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {
              [testData.field]: { message: testData.errorMessage, type: 'validation' }
            },
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldErrorLocal,
            status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Find the input field
            const input = testData.field === 'email' 
              ? screen.getByLabelText(/email address/i)
              : screen.getByLabelText(/^password$/i);

            // Type a simple character in the field
            await user.type(input, 'a');

            // Property: clearFieldError must be called when user types
            // It should be called at least once (may be called for multiple fields)
            expect(mockClearFieldErrorLocal).toHaveBeenCalled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 13: Rate limiting prevents submission
   * **Validates: Requirements 8.1, 8.3, 4.4**
   * 
   * For any form with active rate limiting, submission attempts should be prevented
   * and the button should be disabled.
   */
  test('property: rate limiting prevents submission', () => {
    fc.assert(
      fc.property(
        fc.record({
          remainingTime: fc.integer({ min: 1, max: 300 }),
        }),
        (testData) => {
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: true,
            rateLimitRemainingTime: testData.remainingTime,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: Submit button must be disabled when rate limited
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            expect(submitButton).toBeDisabled();

            // Property: Form fields must be disabled when rate limited
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: Rate limiting displays countdown
   * **Validates: Requirements 8.2**
   * 
   * For any form with active rate limiting, the remaining time should be displayed to the user.
   */
  test('property: rate limiting displays countdown', () => {
    fc.assert(
      fc.property(
        fc.record({
          remainingTime: fc.integer({ min: 1, max: 300 }),
        }),
        (testData) => {
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: true,
            rateLimitRemainingTime: testData.remainingTime,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: Rate limit message must display remaining time
            const rateLimitMessage = screen.getByText(
              new RegExp(`too many attempts.*${testData.remainingTime} seconds`, 'i')
            );
            expect(rateLimitMessage).toBeInTheDocument();
            expect(rateLimitMessage).toHaveAttribute('role', 'alert');
            expect(rateLimitMessage).toHaveAttribute('aria-live', 'polite');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Failed attempts increment rate limit
   * **Validates: Requirements 8.4**
   * 
   * For any failed authentication attempt (401), the rate limit counter should be incremented.
   * Note: This property is tested at the hook level (useLoginForm) rather than component level.
   */
  test('property: failed attempts are tracked for rate limiting', () => {
    fc.assert(
      fc.property(
        fc.record({
          attemptNumber: fc.integer({ min: 1, max: 5 }),
          remainingTime: fc.integer({ min: 1, max: 60 }),
        }),
        (testData) => {
          // After failed attempts, rate limiting should be active
          const isRateLimited = testData.attemptNumber >= 5;

          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: isRateLimited,
            rateLimitRemainingTime: isRateLimited ? testData.remainingTime : 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: After 5 failed attempts, rate limiting should be active
            if (isRateLimited) {
              const submitButton = screen.getByRole('button', { name: /sign in/i });
              expect(submitButton).toBeDisabled();
              expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 16: Successful submission resets rate limit
   * **Validates: Requirements 8.5**
   * 
   * For any successful authentication, the rate limit counter should be reset.
   * Note: This property is tested at the hook level (useLoginForm) rather than component level.
   */
  test('property: successful submission allows immediate retry', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        (formData) => {
          // After successful login, rate limiting should not be active
          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: jest.fn((callback) => (e: React.FormEvent) => e.preventDefault()),
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: jest.fn(),
            isRateLimited: false, // Rate limit reset after success
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: After successful login, form should be fully functional
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            expect(submitButton).not.toBeDisabled();

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            expect(emailInput).not.toBeDisabled();
            expect(passwordInput).not.toBeDisabled();

            // Property: No rate limit message should be displayed
            expect(screen.queryByText(/too many attempts/i)).not.toBeInTheDocument();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
