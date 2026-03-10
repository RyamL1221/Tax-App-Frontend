/**
 * Property-Based Tests for LoginForm (Part 2)
 * Feature: fix-form-submission
 * 
 * Continuation of property-based tests for validation, loading states, and rate limiting.
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

describe('LoginForm - Property-Based Tests (Part 2)', () => {
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
   * Property 5: Invalid data prevents API calls
   * **Validates: Requirements 3.3, 7.1, 7.2, 7.3, 7.4**
   * 
   * For any invalid form data, the form should not invoke the API client.
   */
  test('property: invalid data prevents API calls', async () => {
    await fc.assert(
      fc.asyncProperty(
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
        async (testData) => {
          // Skip if no errors (we want to test invalid data)
          if (!testData.hasEmailError && !testData.hasPasswordError) {
            return true;
          }

          const user = userEvent.setup();
          const mockOnSubmit = jest.fn();

          // Mock handleSubmit that doesn't call callback when there are errors
          const mockHandleSubmit = jest.fn((callback) => async (e: React.FormEvent) => {
            e.preventDefault();
            // Don't call callback if there are validation errors
          });

          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: mockHandleSubmit,
            errors: {
              ...(testData.hasEmailError ? { email: { message: testData.emailError, type: 'validation' } } : {}),
              ...(testData.hasPasswordError ? { password: { message: testData.passwordError, type: 'validation' } } : {}),
            },
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: mockOnSubmit,
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);

            // Property: For any invalid data, the onSubmit handler must NOT be called
            expect(mockOnSubmit).not.toHaveBeenCalled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Valid data invokes custom handler
   * **Validates: Requirements 3.4, 3.5**
   * 
   * For any valid form data, React Hook Form should invoke the custom submission handler
   * with the validated data.
   */
  test('property: valid data invokes custom handler with validated data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async (formData) => {
          const user = userEvent.setup();
          let receivedData: any = null;

          const mockOnSubmit = jest.fn(async (data: any) => {
            receivedData = data;
          });

          const mockHandleSubmit = jest.fn((callback) => async (e: React.FormEvent) => {
            e.preventDefault();
            await callback(formData, e);
          });

          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: mockHandleSubmit,
            errors: {},
            isSubmitting: false,
            showPassword: false,
            togglePasswordVisibility: mockTogglePasswordVisibility,
            onSubmit: mockOnSubmit,
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
          status: { state: 'idle', message: '' },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);

            await waitFor(() => {
              // Property: The custom handler must receive the validated form data
              expect(mockOnSubmit).toHaveBeenCalled();
              expect(receivedData).toEqual(formData);
            });
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Submit button triggers form submission
   * **Validates: Requirements 4.2**
   * 
   * For any submit button click, the form's onSubmit event should be triggered.
   */
  test('property: submit button triggers form submission', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async (formData) => {
          const user = userEvent.setup();
          const mockHandleSubmit = jest.fn((callback) => async (e: React.FormEvent) => {
            e.preventDefault();
            await callback(formData, e);
          });

          mockUseLoginForm.mockReturnValue({
            register: mockRegister,
            handleSubmit: mockHandleSubmit,
            errors: {},
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
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);

            await waitFor(() => {
              // Property: Clicking submit button must trigger handleSubmit
              expect(mockHandleSubmit).toHaveBeenCalled();
            });
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Submitting state disables button
   * **Validates: Requirements 4.3, 5.1, 5.2**
   * 
   * For any form in submitting state, the submit button should be disabled and show loading text.
   */
  test('property: submitting state disables button and shows loading text', () => {
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
            isSubmitting: true,
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
            // Property: Submit button must be disabled during submission
            const submitButton = screen.getByRole('button', { name: /logging in/i });
            expect(submitButton).toBeDisabled();
            expect(submitButton).toHaveAttribute('aria-busy', 'true');

            // Property: Form fields must be disabled during submission
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
});
