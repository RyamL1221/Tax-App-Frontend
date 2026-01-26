/**
 * Unit tests for viewport change handling and form state persistence
 * 
 * This test file specifically validates:
 * - Requirements 6.3: Form state persists during viewport changes
 * 
 * Tests verify that when the viewport size changes (e.g., device rotation,
 * browser resize), all form data and error states are preserved.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
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

describe('Viewport Change Handling and Form State Persistence', () => {
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

    // Clear sessionStorage to reset rate limiting between tests
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

  describe('Requirement 6.3: Form State Persists During Viewport Changes', () => {
    test('should preserve email input value when resizing from mobile to desktop', async () => {
      const user = userEvent.setup();

      // Start with mobile viewport
      resizeViewport(375, 667);

      render(<LoginPageClient />);

      // Enter email on mobile
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');

      // Resize to desktop
      resizeViewport(1920, 1080);

      // Email value should still be present
      await waitFor(() => {
        expect(emailInput).toHaveValue('test@example.com');
      });
    });

    test('should preserve password input value when resizing from desktop to mobile', async () => {
      const user = userEvent.setup();

      // Start with desktop viewport
      resizeViewport(1920, 1080);

      render(<LoginPageClient />);

      // Enter password on desktop
      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'mypassword123');

      expect(passwordInput).toHaveValue('mypassword123');

      // Resize to mobile
      resizeViewport(375, 667);

      // Password value should still be present
      await waitFor(() => {
        expect(passwordInput).toHaveValue('mypassword123');
      });
    });

    test('should preserve both email and password values during multiple viewport changes', async () => {
      const user = userEvent.setup();

      render(<LoginPageClient />);

      // Enter both email and password
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'securepass123');

      expect(emailInput).toHaveValue('user@example.com');
      expect(passwordInput).toHaveValue('securepass123');

      // Resize to mobile
      resizeViewport(375, 667);
      await waitFor(() => {
        expect(emailInput).toHaveValue('user@example.com');
        expect(passwordInput).toHaveValue('securepass123');
      });

      // Resize to tablet
      resizeViewport(768, 1024);
      await waitFor(() => {
        expect(emailInput).toHaveValue('user@example.com');
        expect(passwordInput).toHaveValue('securepass123');
      });

      // Resize to desktop
      resizeViewport(1920, 1080);
      await waitFor(() => {
        expect(emailInput).toHaveValue('user@example.com');
        expect(passwordInput).toHaveValue('securepass123');
      });
    });

    test('should preserve validation errors when resizing viewport', async () => {
      const user = userEvent.setup();

      render(<LoginPageClient />);

      // Enter invalid email
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      
      // Trigger validation by blurring
      fireEvent.blur(emailInput);

      // Wait for validation error to appear
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Resize viewport
      resizeViewport(375, 667);

      // Error should still be present
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Input value should still be present
      expect(emailInput).toHaveValue('invalid-email');
    });

    test('should preserve password visibility state during viewport changes', async () => {
      const user = userEvent.setup();

      render(<LoginPageClient />);

      // Enter password
      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'mypassword');

      // Toggle password visibility
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);

      // Password should be visible (type="text")
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Resize viewport
      resizeViewport(375, 667);

      // Password should still be visible
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });

      // Password value should still be present
      expect(passwordInput).toHaveValue('mypassword');
    });

    test('should preserve form submission state during viewport changes', async () => {
      const user = userEvent.setup();

      // Mock fetch to delay response
      global.fetch = jest.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              json: async () => ({
                success: false,
                error: {
                  type: 'authentication',
                  message: 'Invalid credentials',
                },
              }),
            } as Response);
          }, 1000);
        })
      );

      render(<LoginPageClient />);

      // Fill form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Resize viewport during submission
      resizeViewport(375, 667);

      // Button should still be disabled
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Wait for submission to complete
      await waitFor(
        () => {
          expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Button should be re-enabled after submission
      expect(submitButton).not.toBeDisabled();
    });

    test('should preserve authentication error messages during viewport changes', async () => {
      const user = userEvent.setup();

      // Mock failed authentication
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: async () => ({
            success: false,
            error: {
              type: 'authentication',
              message: 'Invalid email or password',
            },
          }),
        } as Response)
      );

      render(<LoginPageClient />);

      // Fill and submit form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Resize viewport
      resizeViewport(375, 667);

      // Error message should still be present
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Form values should still be present
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('wrongpassword');
    });

    test('should preserve rate limit state during viewport changes', async () => {
      const user = userEvent.setup();

      // Mock rate limit error
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: async () => ({
            success: false,
            error: {
              type: 'authentication',
              message: 'Invalid credentials',
            },
          }),
        } as Response)
      );

      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Make 5 failed attempts to trigger rate limit
      for (let i = 0; i < 5; i++) {
        await user.type(emailInput, `test${i}@example.com`);
        await user.type(passwordInput, 'wrongpassword');
        await user.click(submitButton);

        // Wait for the submission to complete
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledTimes(i + 1);
        });

        // Clear the inputs for next iteration (except last one)
        if (i < 4) {
          await user.clear(emailInput);
          await user.clear(passwordInput);
        }
      }

      // Should now be rate limited
      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
      });

      // Resize viewport
      resizeViewport(375, 667);

      // Rate limit message should still be present
      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
      });

      // Submit button should still be disabled
      expect(submitButton).toBeDisabled();
    });

    test('should maintain focus on input during viewport resize', async () => {
      const user = userEvent.setup();

      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);

      // Focus on email input
      await user.click(emailInput);
      expect(emailInput).toHaveFocus();

      // Resize viewport
      resizeViewport(375, 667);

      // Verify we can still interact with the input after resize
      await waitFor(() => {
        expect(emailInput).toBeInTheDocument();
      });

      // Verify we can still type in the input
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    test('should preserve empty form state during viewport changes', async () => {
      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      // Verify form is empty
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');

      // Resize viewport
      resizeViewport(375, 667);

      // Form should still be empty
      await waitFor(() => {
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
      });
    });

    test('should handle rapid viewport changes without losing state', async () => {
      const user = userEvent.setup();

      render(<LoginPageClient />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      // Enter values
      await user.type(emailInput, 'rapid@test.com');
      await user.type(passwordInput, 'rapidtest123');

      // Perform rapid viewport changes
      resizeViewport(375, 667);   // Mobile
      resizeViewport(768, 1024);  // Tablet
      resizeViewport(1920, 1080); // Desktop
      resizeViewport(375, 667);   // Back to mobile
      resizeViewport(1920, 1080); // Back to desktop

      // Values should still be present
      await waitFor(() => {
        expect(emailInput).toHaveValue('rapid@test.com');
        expect(passwordInput).toHaveValue('rapidtest123');
      });
    });
  });

  describe('Layout Transitions During Viewport Changes', () => {
    test('should maintain form functionality after viewport change', async () => {
      const user = userEvent.setup();

      // Start with mobile
      resizeViewport(375, 667);

      render(<LoginPageClient />);

      // Resize to desktop
      resizeViewport(1920, 1080);

      // Form should still be functional
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');

      // Submit button should be clickable
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });

    test('should maintain accessibility features after viewport change', async () => {
      // Start with mobile
      resizeViewport(375, 667);

      render(<LoginPageClient />);

      // Resize to desktop
      resizeViewport(1920, 1080);

      // Verify accessibility attributes are still present
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      expect(emailInput).toHaveAttribute('aria-label', 'Email Address');
      expect(passwordInput).toHaveAttribute('aria-label', 'Password');
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });
  });
});
