/**
 * Property-based tests for Login Page Server Component
 * 
 * Feature: login-page, Property 17: Valid session triggers redirect
 * **Validates: Requirements 8.3**
 * 
 * This test validates that any user with a valid session token who visits
 * the login page is automatically redirected to the authenticated area.
 */

import * as fc from 'fast-check';
import { redirect } from 'next/navigation';
import type { SessionData } from '@/lib/session';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the session module
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  clearSession: jest.fn(),
}));

// Mock the LoginPageClient component
jest.mock('./LoginPageClient', () => {
  return function MockLoginPageClient() {
    return <div data-testid="login-page-client">Login Page Client</div>;
  };
});

// Import the page component after mocks are set up
import LoginPage from './page';
import { getSession } from '@/lib/session';

describe('Login Page Server Component - Session Redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property-Based Tests', () => {
    // Feature: login-page, Property 17: Valid session triggers redirect
    // **Validates: Requirements 8.3**
    test('property: any user with a valid session token is redirected to authenticated area', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary user IDs (non-empty, non-whitespace strings)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Generate email addresses
          fc.emailAddress(),
          // Generate optional callback URLs
          fc.option(fc.webUrl(), { nil: undefined }),
          async (userId, email, callbackUrl) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock getSession to return valid session data
            const mockSessionData: SessionData = {
              userId,
              email,
              createdAt: Date.now() - 1000,
              expiresAt: Date.now() + 3600000, // 1 hour from now
            };
            (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

            // Mock redirect to track if it was called
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
            mockRedirect.mockImplementation(() => {
              throw new Error('NEXT_REDIRECT'); // Next.js redirect throws
            });

            // Prepare search params
            const searchParams = callbackUrl ? { callbackUrl } : {};

            // Act & Assert: Calling the page should trigger redirect
            try {
              await LoginPage({ searchParams });
              // If we reach here, redirect was not called - test should fail
              expect(true).toBe(false); // Force failure
            } catch (error: any) {
              // Redirect should have been called
              expect(mockRedirect).toHaveBeenCalledTimes(1);
              
              // Verify redirect URL is correct
              const expectedUrl = callbackUrl || '/dashboard';
              expect(mockRedirect).toHaveBeenCalledWith(expectedUrl);
              
              // Verify error is from redirect
              expect(error.message).toBe('NEXT_REDIRECT');
            }

            // Verify getSession was called
            expect(getSession).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: users without session tokens are not redirected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate optional callback URLs
          fc.option(fc.webUrl(), { nil: undefined }),
          async (callbackUrl) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock getSession to return null (no session)
            (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

            // Mock redirect to track if it was called
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

            // Prepare search params
            const searchParams = callbackUrl ? { callbackUrl } : {};

            // Act: Call the page component
            const result = await LoginPage({ searchParams });

            // Assert: Redirect should NOT have been called
            expect(mockRedirect).not.toHaveBeenCalled();
            
            // Should render the login page client
            expect(result).toBeDefined();
            
            // Verify getSession was called
            expect(getSession).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: users with invalid/expired session tokens are not redirected', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate optional callback URLs
          fc.option(fc.webUrl(), { nil: undefined }),
          async (callbackUrl) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock getSession to return null (invalid/expired session)
            (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(null);

            // Mock redirect to track if it was called
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

            // Prepare search params
            const searchParams = callbackUrl ? { callbackUrl } : {};

            // Act: Call the page component
            const result = await LoginPage({ searchParams });

            // Assert: Redirect should NOT have been called
            expect(mockRedirect).not.toHaveBeenCalled();
            
            // Should render the login page client
            expect(result).toBeDefined();
            
            // Verify getSession was called
            expect(getSession).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: redirect URL defaults to /dashboard when no callbackUrl provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary user IDs (non-empty, non-whitespace strings)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Generate email addresses
          fc.emailAddress(),
          async (userId, email) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock getSession to return valid session data
            const mockSessionData: SessionData = {
              userId,
              email,
              createdAt: Date.now() - 1000,
              expiresAt: Date.now() + 3600000, // 1 hour from now
            };
            (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

            // Mock redirect
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
            mockRedirect.mockImplementation(() => {
              throw new Error('NEXT_REDIRECT');
            });

            // Act & Assert: No callbackUrl in searchParams
            try {
              await LoginPage({ searchParams: {} });
              expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
              // Should redirect to default /dashboard
              expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
              expect(error.message).toBe('NEXT_REDIRECT');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: redirect URL uses callbackUrl when provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary user IDs (non-empty, non-whitespace strings)
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          // Generate email addresses
          fc.emailAddress(),
          // Generate callback URLs
          fc.webUrl(),
          async (userId, email, callbackUrl) => {
            // Clear mocks before each iteration
            jest.clearAllMocks();
            
            // Arrange: Mock getSession to return valid session data
            const mockSessionData: SessionData = {
              userId,
              email,
              createdAt: Date.now() - 1000,
              expiresAt: Date.now() + 3600000, // 1 hour from now
            };
            (getSession as jest.MockedFunction<typeof getSession>).mockResolvedValue(mockSessionData);

            // Mock redirect
            const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
            mockRedirect.mockImplementation(() => {
              throw new Error('NEXT_REDIRECT');
            });

            // Act & Assert: With callbackUrl in searchParams
            try {
              await LoginPage({ searchParams: { callbackUrl } });
              expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
              // Should redirect to the provided callbackUrl
              expect(mockRedirect).toHaveBeenCalledWith(callbackUrl);
              expect(error.message).toBe('NEXT_REDIRECT');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
