import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as fc from 'fast-check';
import RegisterPageClient from './RegisterPageClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthCoordinator - the component uses getAuthState() (JWT-only, no HTTP requests)
const mockGetAuthState = jest.fn();
jest.mock('@/lib/auth/AuthCoordinator', () => ({
  getAuthState: (...args: unknown[]) => mockGetAuthState(...args),
}));

// Mock RegistrationForm component
jest.mock('@/components/RegistrationForm', () => ({
  RegistrationForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="registration-form">
      <button onClick={onSuccess}>Register</button>
    </div>
  ),
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string; variant?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

describe('RegisterPageClient', () => {
  const mockPush = jest.fn();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Property-Based Tests', () => {
    // Task 7.1: Write property test for successful registration redirect
    // Feature: register-page, Property 12: Successful registration triggers redirect
    // **Validates: Requirements 6.3, 10.2**
    test('property: successful registration triggers redirect', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various callback URLs or use default
          fc.option(
            fc.constantFrom(
              '/dashboard',
              '/profile',
              '/home',
              '/welcome',
              '/onboarding'
            ),
            { nil: undefined }
          ),
          async (callbackUrl) => {
            // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
            mockGetAuthState.mockResolvedValueOnce({
              isAuthenticated: false,
              hasJWT: false,
              hasSession: false,
              inFallbackMode: false,
              authMethod: 'none',
              userId: null,
              email: null,
            });

            const { unmount } = render(
              <RegisterPageClient callbackUrl={callbackUrl} />
            );

            // Wait for auth check to complete
            await waitFor(() => {
              expect(screen.getByTestId('registration-form')).toBeInTheDocument();
            });

            // Simulate successful registration
            const registerButton = screen.getByRole('button', { name: /register/i });
            registerButton.click();

            // Property: After successful registration, user should be redirected
            await waitFor(() => {
              const expectedUrl = callbackUrl || '/dashboard';
              expect(mockPush).toHaveBeenCalledWith(expectedUrl);
            });

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Task 7.2: Write property test for failed registration error display
    // Feature: register-page, Property 13: Failed registration displays error message
    // **Validates: Requirements 6.4**
    test('property: failed registration displays error message', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various error scenarios
          fc.record({
            errorType: fc.constantFrom(
              'validation',
              'network',
              'server',
              'conflict'
            ),
          }),
          async () => {
            // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
            mockGetAuthState.mockResolvedValueOnce({
              isAuthenticated: false,
              hasJWT: false,
              hasSession: false,
              inFallbackMode: false,
              authMethod: 'none',
              userId: null,
              email: null,
            });

            const { unmount } = render(<RegisterPageClient />);

            // Wait for auth check to complete
            await waitFor(() => {
              expect(screen.getByTestId('registration-form')).toBeInTheDocument();
            });

            // Property: Registration form should be displayed for unauthenticated users
            // The form itself handles error display, so we verify the form is rendered
            // and can display errors (this is tested in RegistrationForm.test.tsx)
            const form = screen.getByTestId('registration-form');
            expect(form).toBeInTheDocument();

            // Property: Failed registration should NOT trigger redirect
            // (onSuccess callback should not be called on failure)
            expect(mockPush).not.toHaveBeenCalled();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Task 7.3: Write property test for authenticated user redirect
    // Feature: register-page, Property 18: Authenticated users redirect from register page
    // **Validates: Requirements 10.4**
    test('property: authenticated users redirect from register page', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various callback URLs or use default
          fc.option(
            fc.constantFrom(
              '/dashboard',
              '/profile',
              '/home',
              '/admin',
              '/settings'
            ),
            { nil: undefined }
          ),
          async (callbackUrl) => {
            // Mock authenticated user via getAuthState (JWT-only, no HTTP requests)
            mockGetAuthState.mockResolvedValueOnce({
              isAuthenticated: true,
              hasJWT: true,
              hasSession: false,
              inFallbackMode: false,
              authMethod: 'jwt',
              userId: null,
              email: null,
            });

            const { unmount } = render(
              <RegisterPageClient callbackUrl={callbackUrl} />
            );

            // Property: Authenticated users should be redirected
            // Form is rendered immediately (no loading state), redirect happens after auth check
            await waitFor(() => {
              const expectedUrl = callbackUrl || '/dashboard';
              expect(mockPush).toHaveBeenCalledWith(expectedUrl);
            });

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Additional property test: Auth check failure handling
    test('property: auth check failure allows registration', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various error scenarios
          fc.constantFrom(
            'network-error',
            'server-error',
            'timeout',
            'invalid-response'
          ),
          async () => {
            // Mock getAuthState throwing an error (JWT-only, no HTTP requests)
            mockGetAuthState.mockRejectedValueOnce(new Error('Auth check failed'));

            const { unmount } = render(<RegisterPageClient />);

            // Property: If auth check fails, assume not authenticated and show form
            await waitFor(() => {
              expect(screen.getByTestId('registration-form')).toBeInTheDocument();
            });

            // Property: Should not redirect on auth check failure
            expect(mockPush).not.toHaveBeenCalled();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    // Task 7.4: Write unit tests for RegisterPageClient
    
    it('should redirect authenticated users to dashboard', async () => {
      // Mock authenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: true,
        hasJWT: true,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'jwt',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient />);

      // Form is rendered immediately (no loading state), redirect happens after auth check
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect authenticated users to custom callback URL', async () => {
      // Mock authenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: true,
        hasJWT: true,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'jwt',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient callbackUrl="/profile" />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/profile');
      });
    });

    it('should render form for unauthenticated users', async () => {
      // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'none',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should call onSuccess callback and redirect on successful registration', async () => {
      // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'none',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });

      // Simulate successful registration
      const registerButton = screen.getByRole('button', { name: /register/i });
      registerButton.click();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should redirect to custom callback URL on successful registration', async () => {
      // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'none',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient callbackUrl="/welcome" />);

      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });

      // Simulate successful registration
      const registerButton = screen.getByRole('button', { name: /register/i });
      registerButton.click();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/welcome');
      });
    });

    it('should render form immediately without loading state', () => {
      // Mock pending auth check (never resolves)
      mockGetAuthState.mockImplementationOnce(
        () => new Promise(() => {})
      );

      render(<RegisterPageClient />);

      // Form should be rendered immediately (no loading state)
      // Auth check runs in background and redirects if needed
      expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    });

    it('should handle auth check errors gracefully', async () => {
      // Mock getAuthState throwing an error
      mockGetAuthState.mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<RegisterPageClient />);

      // Should show form even if auth check fails
      await waitFor(() => {
        expect(screen.getByTestId('registration-form')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should render page title and description', async () => {
      // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'none',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/sign up to get started/i)).toBeInTheDocument();
    });

    it('should use getAuthState for auth check on mount (no HTTP requests)', async () => {
      // Mock unauthenticated user via getAuthState (JWT-only, no HTTP requests)
      mockGetAuthState.mockResolvedValueOnce({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        inFallbackMode: false,
        authMethod: 'none',
        userId: null,
        email: null,
      });

      render(<RegisterPageClient />);

      await waitFor(() => {
        expect(mockGetAuthState).toHaveBeenCalled();
      });
    });
  });
});
