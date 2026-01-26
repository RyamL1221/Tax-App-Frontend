/**
 * Property-based test for successful authentication redirect
 * 
 * Feature: login-page, Property 2: Successful authentication redirects user
 * **Validates: Requirements 1.2**
 * 
 * This test validates that for any successful authentication response,
 * the login page should navigate the user to the appropriate authenticated page.
 */

import * as fc from 'fast-check';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LoginPageClient from './LoginPageClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the authentication API
global.fetch = jest.fn();

describe('Login Page - Authentication Redirect', () => {
  let mockPush: jest.Mock;
  let mockRouter: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    mockPush = jest.fn();
    mockRouter = {
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Clear any existing DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up DOM
    document.body.innerHTML = '';
  });

  describe('Property-Based Tests', () => {
    // Feature: login-page, Property 2: Successful authentication redirects user
    // **Validates: Requirements 1.2**
    test('property: successful authentication redirects user to appropriate page', async () => {
      // This property test validates that the redirect logic works correctly
      // for any valid redirect URL. We use unit test approach with property-based
      // URL generation to avoid slow UI interactions.
      await fc.assert(
        fc.asyncProperty(
          // Generate redirect URLs (or use default)
          fc.option(fc.constantFrom('/dashboard', '/home', '/profile', '/settings', '/admin', '/account'), { nil: undefined }),
          async (redirectUrl) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();
            mockPush.mockClear();

            // Mock successful authentication response
            const mockResponse = {
              success: true,
              redirectUrl: redirectUrl || '/dashboard',
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => mockResponse,
            });

            // Render and test
            const { unmount } = render(<LoginPageClient callbackUrl={undefined} />);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const submitButton = screen.getByRole('button', { name: /sign in/i });

            // Use fixed valid credentials to avoid validation issues
            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.click(submitButton);

            // Wait for redirect
            await waitFor(
              () => {
                expect(mockPush).toHaveBeenCalled();
              },
              { timeout: 5000 }
            );

            // Verify correct URL
            const expectedUrl = redirectUrl || '/dashboard';
            expect(mockPush).toHaveBeenCalledWith(expectedUrl);
            
            unmount();
          }
        ),
        { numRuns: 20 } // Test with various redirect URLs
      );
    }, 120000); // 2 minute timeout for property test

    test('property: callbackUrl takes precedence over response redirectUrl', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate callback URL
          fc.constantFrom('/dashboard', '/home', '/profile', '/settings'),
          // Generate response redirect URL (different from callback)
          fc.constantFrom('/other', '/different', '/alternate'),
          async (callbackUrl, responseRedirectUrl) => {
            // Clear mocks for each iteration
            jest.clearAllMocks();
            mockPush.mockClear();

            // Mock successful authentication response
            const mockResponse = {
              success: true,
              redirectUrl: responseRedirectUrl,
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => mockResponse,
            });

            // Render with callbackUrl
            const { unmount } = render(<LoginPageClient callbackUrl={callbackUrl} />);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const submitButton = screen.getByRole('button', { name: /sign in/i });

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.click(submitButton);

            // Wait for redirect
            await waitFor(
              () => {
                expect(mockPush).toHaveBeenCalled();
              },
              { timeout: 5000 }
            );

            // Verify callbackUrl was used
            expect(mockPush).toHaveBeenCalledWith(callbackUrl);
            
            unmount();
          }
        ),
        { numRuns: 8 } // Reduced runs for UI tests
      );
    }, 60000); // 60 second timeout

    test('property: default redirect is /dashboard when no URLs provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Just run multiple times with same inputs
          fc.constant(null),
          async () => {
            // Clear mocks for each iteration
            jest.clearAllMocks();
            mockPush.mockClear();

            // Mock successful authentication response without redirectUrl
            const mockResponse = {
              success: true,
              // No redirectUrl provided
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              json: async () => mockResponse,
            });

            // Render without callbackUrl
            const { unmount } = render(<LoginPageClient callbackUrl={undefined} />);

            const emailInput = screen.getByLabelText(/email address/i);
            const passwordInput = screen.getByLabelText(/^password$/i);
            const submitButton = screen.getByRole('button', { name: /sign in/i });

            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.click(submitButton);

            // Wait for redirect
            await waitFor(
              () => {
                expect(mockPush).toHaveBeenCalled();
              },
              { timeout: 5000 }
            );

            // Verify default /dashboard was used
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
            
            unmount();
          }
        ),
        { numRuns: 5 } // Reduced runs for UI tests
      );
    }, 30000); // 30 second timeout
  });

  describe('Unit Tests - Edge Cases', () => {
    test('should redirect after successful authentication', async () => {
      // Mock successful authentication response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          redirectUrl: '/dashboard',
        }),
      });

      const { unmount } = render(<LoginPageClient callbackUrl={undefined} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 5000 });

      unmount();
    });

    test('should not redirect on failed authentication', async () => {
      // Mock failed authentication response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: {
            type: 'authentication',
            message: 'Invalid email or password',
          },
        }),
      });

      const { unmount } = render(<LoginPageClient callbackUrl={undefined} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify redirect was NOT called
      expect(mockPush).not.toHaveBeenCalled();
      
      unmount();
    });

    test('should handle network errors without redirecting', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { unmount } = render(<LoginPageClient callbackUrl={undefined} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify redirect was NOT called
      expect(mockPush).not.toHaveBeenCalled();
      
      unmount();
    });

    test('should handle malformed API responses without redirecting', async () => {
      // Mock malformed response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Empty response
      });

      const { unmount } = render(<LoginPageClient callbackUrl={undefined} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify redirect was NOT called
      expect(mockPush).not.toHaveBeenCalled();
      
      unmount();
    });

    test('should use callbackUrl when provided', async () => {
      // Mock successful authentication response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          redirectUrl: '/dashboard',
        }),
      });

      const { unmount } = render(<LoginPageClient callbackUrl="/profile" />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(submitButton);

      // Wait for redirect with callbackUrl
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      }, { timeout: 5000 });

      unmount();
    });
  });
});
