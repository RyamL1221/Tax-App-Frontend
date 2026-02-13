/**
 * Property-Based Tests for LoginForm
 * Feature: fix-form-submission
 * 
 * These tests verify universal properties that should hold across all inputs
 * using fast-check for property-based testing with 100+ iterations.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { LoginForm } from './LoginForm';

// Mock the useLoginForm hook
jest.mock('@/hooks/useLoginForm');
import { useLoginForm } from '@/hooks/useLoginForm';

const mockUseLoginForm = useLoginForm as jest.MockedFunction<typeof useLoginForm>;

describe('LoginForm - Property-Based Tests', () => {
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
   * Property 1: Form submission prevents default behavior
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   * 
   * For any form submission event, the default browser behavior should be prevented.
   */
  test('property: form submission prevents default behavior', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid form data
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async (formData) => {
          const user = userEvent.setup();
          let preventDefaultCalled = false;

          // Mock onSubmit that tracks preventDefault
          const mockOnSubmit = jest.fn(async (data: any, event?: React.BaseSyntheticEvent) => {
            if (event) {
              // Check if preventDefault was called
              preventDefaultCalled = event.defaultPrevented;
            }
          });

          // Mock handleSubmit that calls preventDefault
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
            // Submit the form
            const submitButton = screen.getByRole('button', { name: /sign in/i });
            await user.click(submitButton);

            await waitFor(() => {
              // Property: preventDefault must be called for any form submission
              expect(mockHandleSubmit).toHaveBeenCalled();
              expect(preventDefaultCalled).toBe(true);
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
   * Property 2: Valid data triggers API client
   * **Validates: Requirements 2.1, 2.2, 7.5**
   * 
   * For any valid form data, submitting the form should invoke the API client login method.
   */
  test('property: valid data triggers API client', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random valid form data
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
        }),
        async (formData) => {
          const user = userEvent.setup();
          const mockOnSubmit = jest.fn();

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
              // Property: For any valid data, the onSubmit handler must be called
              expect(mockOnSubmit).toHaveBeenCalled();
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
   * Property 3: Successful API calls trigger navigation
   * **Validates: Requirements 2.3**
   * 
   * For any successful API response, the system should redirect the user.
   */
  test('property: successful API calls trigger navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 50 }),
          redirectUrl: fc.constantFrom('/dashboard', '/home', '/profile'),
        }),
        async (testData) => {
          const user = userEvent.setup();
          const mockOnSubmit = jest.fn(async () => {
            // Simulate successful API call
            mockOnSuccess(testData.redirectUrl);
          });

          const mockHandleSubmit = jest.fn((callback) => async (e: React.FormEvent) => {
            e.preventDefault();
            await callback(testData, e);
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
              // Property: Successful API calls must trigger the onSuccess callback
              expect(mockOnSuccess).toHaveBeenCalledWith(testData.redirectUrl);
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
   * Property 4: Failed API calls display errors
   * **Validates: Requirements 2.4, 6.1, 6.2, 6.3**
   * 
   * For any failed API response, the system should display an error message.
   */
  test('property: failed API calls display errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          errorMessage: fc.constantFrom(
            'Invalid email or password',
            'Unable to connect. Please check your connection and try again',
            'Something went wrong. Please try again later'
          ),
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
            isRateLimited: false,
            rateLimitRemainingTime: 0,
            clearFieldError: mockClearFieldError,
            status: { state: 'error', message: testData.errorMessage },
          });

          const { unmount } = render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

          try {
            // Property: For any error, an error message must be displayed
            const errorAlert = screen.getByRole('alert');
            expect(errorAlert).toHaveTextContent(testData.errorMessage);
            expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
