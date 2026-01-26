/**
 * Property-Based Tests for Form State Persistence During Viewport Changes
 * 
 * Feature: login-page
 * Property 13: Form state persists during viewport changes
 * 
 * **Validates: Requirements 6.3**
 * 
 * This test file uses property-based testing to verify that form state
 * (including entered values and validation errors) persists across viewport
 * changes for ANY possible form state and viewport dimensions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import * as fc from 'fast-check';
import LoginPageClient from './LoginPageClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className, variant }: any) => (
    <div data-testid="card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

/**
 * Helper function to simulate viewport resize
 */
const resizeViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

/**
 * Arbitrary generator for viewport dimensions
 * Generates realistic viewport sizes from mobile to large desktop
 */
const viewportArbitrary = fc.record({
  width: fc.integer({ min: 320, max: 3840 }), // From small mobile to 4K
  height: fc.integer({ min: 568, max: 2160 }), // From iPhone SE to 4K
});

/**
 * Arbitrary generator for email strings
 * Generates both valid and invalid email formats
 * Uses alphanumeric characters to avoid userEvent keyboard command issues
 */
const emailArbitrary = fc.oneof(
  fc.emailAddress(), // Valid emails
  fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z0-9]/gi, 'a')), // Invalid emails (alphanumeric without @)
  fc.constant(''), // Empty email
);

/**
 * Arbitrary generator for password strings
 * Uses alphanumeric characters to avoid userEvent keyboard command issues
 */
const passwordArbitrary = fc.oneof(
  fc.string({ minLength: 8, maxLength: 50 }).map(s => s.replace(/[^a-z0-9]/gi, 'a')), // Valid passwords (alphanumeric)
  fc.string({ minLength: 1, maxLength: 7 }).map(s => s.replace(/[^a-z0-9]/gi, 'a')), // Too short passwords
  fc.constant(''), // Empty password
);

/**
 * Arbitrary generator for form state
 */
const formStateArbitrary = fc.record({
  email: emailArbitrary,
  password: passwordArbitrary,
  showPassword: fc.boolean(),
});

describe('Property-Based Tests: Form State Persistence During Viewport Changes', () => {
  const mockPush = jest.fn();
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // Store original viewport dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

    // Clear sessionStorage to reset rate limiting
    sessionStorage.clear();
  });

  afterEach(() => {
    // Restore original viewport dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });

    // Clean up sessionStorage
    sessionStorage.clear();
  });

  /**
   * Feature: login-page, Property 13: Form state persists during viewport changes
   * 
   * For ANY form state (email, password, password visibility) and ANY viewport
   * dimensions, resizing the viewport should preserve all form data.
   * 
   * **Validates: Requirements 6.3**
   */
  test('Property 13: Form state persists during viewport changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        formStateArbitrary,
        viewportArbitrary,
        viewportArbitrary,
        async (formState, viewport1, viewport2) => {
          const user = userEvent.setup();

          // Set initial viewport
          resizeViewport(viewport1.width, viewport1.height);

          const { unmount } = render(<LoginPageClient />);

          try {
            // Get form elements
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const toggleButton = screen.getByRole('button', { name: /show password|hide password/i });

            // Set form state using fireEvent to avoid userEvent keyboard command issues
            if (formState.email) {
              fireEvent.change(emailInput, { target: { value: formState.email } });
            }
            if (formState.password) {
              fireEvent.change(passwordInput, { target: { value: formState.password } });
            }

            // Set password visibility if needed
            const currentPasswordType = passwordInput.getAttribute('type');
            const isCurrentlyVisible = currentPasswordType === 'text';
            if (formState.showPassword !== isCurrentlyVisible) {
              await user.click(toggleButton);
            }

            // Verify initial state
            expect(emailInput).toHaveValue(formState.email);
            expect(passwordInput).toHaveValue(formState.password);
            expect(passwordInput).toHaveAttribute(
              'type',
              formState.showPassword ? 'text' : 'password'
            );

            // Resize viewport
            resizeViewport(viewport2.width, viewport2.height);

            // Wait for any potential re-renders
            await waitFor(() => {
              expect(emailInput).toBeInTheDocument();
            });

            // Verify state persisted after resize
            expect(emailInput).toHaveValue(formState.email);
            expect(passwordInput).toHaveValue(formState.password);
            expect(passwordInput).toHaveAttribute(
              'type',
              formState.showPassword ? 'text' : 'password'
            );
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        // Increase timeout for async operations
        timeout: 10000,
        // Skip shrinking to avoid timeout issues
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Email validation errors persist during viewport changes
   * 
   * For ANY invalid email and ANY viewport dimensions, validation errors
   * should persist after viewport resize.
   * 
   * **Validates: Requirements 6.3, 2.2**
   */
  test('Property: Email validation errors persist during viewport changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-z0-9]/gi, 'a')), // Invalid emails (alphanumeric without @)
        viewportArbitrary,
        viewportArbitrary,
        async (invalidEmail, viewport1, viewport2) => {
          const user = userEvent.setup();

          // Set initial viewport
          resizeViewport(viewport1.width, viewport1.height);

          const { unmount } = render(<LoginPageClient />);

          try {
            const emailInput = screen.getByLabelText(/email address/i);

            // Enter invalid email using fireEvent
            fireEvent.change(emailInput, { target: { value: invalidEmail } });

            // Trigger validation by blurring
            fireEvent.blur(emailInput);

            // Wait for validation error
            await waitFor(() => {
              expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });

            // Resize viewport
            resizeViewport(viewport2.width, viewport2.height);

            // Validation error should still be present
            await waitFor(() => {
              expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
            });

            // Email value should still be present
            expect(emailInput).toHaveValue(invalidEmail);
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 50,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Password validation errors persist during viewport changes
   * 
   * For ANY password shorter than 8 characters and ANY viewport dimensions,
   * validation errors should persist after viewport resize.
   * 
   * **Validates: Requirements 6.3, 2.5**
   */
  test('Property: Password validation errors persist during viewport changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 7 }).map(s => s.replace(/[^a-z0-9]/gi, 'a')), // Too short passwords
        viewportArbitrary,
        viewportArbitrary,
        async (shortPassword, viewport1, viewport2) => {
          const user = userEvent.setup();

          // Set initial viewport
          resizeViewport(viewport1.width, viewport1.height);

          const { unmount } = render(<LoginPageClient />);

          try {
            const passwordInput = screen.getByLabelText(/^password$/i);

            // Enter short password using fireEvent
            fireEvent.change(passwordInput, { target: { value: shortPassword } });

            // Trigger validation by blurring
            fireEvent.blur(passwordInput);

            // Wait for validation error
            await waitFor(() => {
              expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
            });

            // Resize viewport
            resizeViewport(viewport2.width, viewport2.height);

            // Validation error should still be present
            await waitFor(() => {
              expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
            });

            // Password value should still be present
            expect(passwordInput).toHaveValue(shortPassword);
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 50,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Multiple viewport changes preserve form state
   * 
   * For ANY form state and ANY sequence of viewport changes, the form state
   * should remain consistent throughout all changes.
   * 
   * **Validates: Requirements 6.3**
   */
  test('Property: Multiple viewport changes preserve form state', async () => {
    await fc.assert(
      fc.asyncProperty(
        formStateArbitrary,
        fc.array(viewportArbitrary, { minLength: 2, maxLength: 5 }),
        async (formState, viewports) => {
          const user = userEvent.setup();

          // Set initial viewport
          resizeViewport(viewports[0].width, viewports[0].height);

          const { unmount } = render(<LoginPageClient />);

          try {
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const toggleButton = screen.getByRole('button', { name: /show password|hide password/i });

            // Set form state using fireEvent to avoid userEvent keyboard command issues
            if (formState.email) {
              fireEvent.change(emailInput, { target: { value: formState.email } });
            }
            if (formState.password) {
              fireEvent.change(passwordInput, { target: { value: formState.password } });
            }

            // Set password visibility
            const currentPasswordType = passwordInput.getAttribute('type');
            const isCurrentlyVisible = currentPasswordType === 'text';
            if (formState.showPassword !== isCurrentlyVisible) {
              await user.click(toggleButton);
            }

            // Perform multiple viewport changes
            for (let i = 1; i < viewports.length; i++) {
              resizeViewport(viewports[i].width, viewports[i].height);

              // Wait for potential re-renders
              await waitFor(() => {
                expect(emailInput).toBeInTheDocument();
              });

              // Verify state persisted
              expect(emailInput).toHaveValue(formState.email);
              expect(passwordInput).toHaveValue(formState.password);
              expect(passwordInput).toHaveAttribute(
                'type',
                formState.showPassword ? 'text' : 'password'
              );
            }
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 50,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Empty form state persists during viewport changes
   * 
   * For ANY viewport dimensions, an empty form should remain empty after resize.
   * 
   * **Validates: Requirements 6.3**
   */
  test('Property: Empty form state persists during viewport changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        viewportArbitrary,
        viewportArbitrary,
        async (viewport1, viewport2) => {
          // Set initial viewport
          resizeViewport(viewport1.width, viewport1.height);

          const { unmount } = render(<LoginPageClient />);

          try {
            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);

            // Verify form is empty
            expect(emailInput).toHaveValue('');
            expect(passwordInput).toHaveValue('');

            // Resize viewport
            resizeViewport(viewport2.width, viewport2.height);

            // Wait for potential re-renders
            await waitFor(() => {
              expect(emailInput).toBeInTheDocument();
            });

            // Form should still be empty
            expect(emailInput).toHaveValue('');
            expect(passwordInput).toHaveValue('');
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });
});
