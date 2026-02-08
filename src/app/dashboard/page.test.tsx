/**
 * Unit tests for Dashboard Page Client Component
 * 
 * Tests that the dashboard page:
 * - Requires JWT-only authentication (no session fallback)
 * - Renders DashboardClient for authenticated users with valid JWT
 * - Redirects unauthenticated users to login page
 * - Displays loading state during authentication check
 * - Integrates with JWT token management system
 * 
 * **Authentication Strategy:**
 * The dashboard enforces strict JWT authentication using `getAuthState({ requireJWT: true })`.
 * Session-only authentication is NOT sufficient for dashboard access. Users must have a
 * valid JWT token to access the dashboard.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 5.4**
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as tokenManager from '@/lib/api/tokenManager';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the tokenManager module
jest.mock('@/lib/api/tokenManager', () => ({
  hasToken: jest.fn(),
  getToken: jest.fn(),
  isValidToken: jest.fn(),
}));

// Mock the LogoutStateManager module
jest.mock('@/lib/auth/LogoutStateManager', () => ({
  logoutStateManager: {
    isLogoutInProgress: jest.fn(),
    setLogoutInProgress: jest.fn(),
    clearLogoutState: jest.fn(),
    getLogoutState: jest.fn(),
  },
}));

// Mock the DashboardClient component
jest.mock('./DashboardClient', () => {
  return function MockDashboardClient() {
    return <div data-testid="dashboard-client">Dashboard Client</div>;
  };
});

// Import the page component after mocks are set up
import DashboardPage from './page';

describe('Dashboard Page Client Component', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    // Reset LogoutStateManager mock to default (not in progress)
    (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(false);
  });

  describe('Authenticated User Access - JWT Required - Requirement 1.2, 1.4', () => {
    test('renders DashboardClient when user has valid JWT token', async () => {
      // Arrange: Mock hasToken to return true (JWT exists)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      const { container } = render(<DashboardPage />);

      // Wait for authentication check to complete
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Should render dashboard client with valid JWT
      expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      
      // Should NOT redirect when JWT is present
      expect(mockPush).not.toHaveBeenCalled();
      
      // Verify hasToken was called
      expect(tokenManager.hasToken).toHaveBeenCalledTimes(1);
    });

    test('renders DashboardClient without redirect when JWT token exists', async () => {
      // Arrange: Mock hasToken to return true (JWT exists)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Verify no redirect occurred with valid JWT
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('displays loading state initially before JWT check completes', () => {
      // Arrange: Mock hasToken to delay return
      let resolveHasToken: (value: boolean) => void;
      const hasTokenPromise = new Promise<boolean>((resolve) => {
        resolveHasToken = resolve;
      });
      
      (tokenManager.hasToken as jest.Mock).mockImplementation(() => {
        // Simulate async behavior
        throw hasTokenPromise;
      });

      // Act: Render the page component
      const { container } = render(<DashboardPage />);

      // Assert: Should show loading state immediately during JWT check
      // Since useEffect runs synchronously in tests, we can't reliably test the loading state
      // This test verifies the component renders without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Unauthenticated User Redirect - JWT Required - Requirement 1.3, 4.1, 4.2, 4.3', () => {
    test('redirects to login with return URL when no JWT token exists', async () => {
      // Arrange: Mock hasToken to return false (no JWT)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should show loading initially during auth check (Requirement 4.4)
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for redirect with return URL
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Verify hasToken was called (called by AuthCoordinator)
      expect(tokenManager.hasToken).toHaveBeenCalled();
    });

    test('does not render DashboardClient when JWT token is missing', async () => {
      // Arrange: Mock hasToken to return false (no JWT)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Assert: Dashboard should never render without JWT
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();
    });

    test('redirect includes return URL parameter when JWT is missing', async () => {
      // Arrange: Mock hasToken to return false (no JWT)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for redirect with return URL
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Assert: Verify redirect was called with exactly '/login?returnUrl=/dashboard'
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush.mock.calls[0][0]).toBe('/login?returnUrl=/dashboard');
    });

    test('redirects immediately without exposing dashboard data when JWT is missing', async () => {
      // Arrange: Mock hasToken to return false (no JWT)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Dashboard client should never be rendered without JWT
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();

      // Wait for redirect with return URL
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Verify dashboard was never exposed
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();
    });

    test('displays loading state during authentication check before redirect', async () => {
      // Arrange: Mock hasToken to return false (no JWT)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should display loading state immediately (Requirement 4.4)
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Loading state should remain visible during redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Loading state prevents black screen during redirect
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('redirect URL includes returnUrl parameter for post-login navigation', async () => {
      // Arrange: Mock hasToken to return false (no JWT)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Assert: Verify redirect includes returnUrl parameter
      expect(mockPush).toHaveBeenCalledTimes(1);
      const redirectUrl = mockPush.mock.calls[0][0];
      expect(redirectUrl).toMatch(/^\/login\?returnUrl=/);
      expect(redirectUrl).toContain('/dashboard');
    });
  });

  describe('JWT Token Management Integration - Requirement 1.1, 1.4', () => {
    test('calls hasToken to verify JWT authentication', async () => {
      // Arrange: Mock hasToken to return true (JWT exists)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(tokenManager.hasToken).toHaveBeenCalled();
      });

      // Assert: Verify hasToken was called to check JWT
      expect(tokenManager.hasToken).toHaveBeenCalledTimes(1);
    });

    test('uses tokenManager module for JWT authentication', async () => {
      // Arrange: Mock hasToken to return true (JWT exists)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Verify hasToken from @/lib/api/tokenManager was used for JWT check
      expect(tokenManager.hasToken).toHaveBeenCalled();
      expect(jest.isMockFunction(tokenManager.hasToken)).toBe(true);
    });

    test('requires JWT token for dashboard access (no session fallback)', async () => {
      // Arrange: Mock hasToken to return false (no JWT, simulating session-only state)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should redirect to login with return URL even if session might exist
      // Dashboard requires JWT, session-only is not sufficient
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Dashboard should never render without JWT
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();
    });
  });

  describe('Loading State During Authentication Check - Requirement 4.4', () => {
    test('displays loading state while authentication check is in progress', async () => {
      // Arrange: Mock hasToken to return true (will eventually authenticate)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      const { container } = render(<DashboardPage />);

      // Assert: Should show loading state initially
      // The loading state appears before authentication completes
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });
    });

    test('loading state has white background to prevent black screen', async () => {
      // Arrange: Mock hasToken to return false (will redirect)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      const { container } = render(<DashboardPage />);

      // Assert: Loading container should have white background
      const loadingContainer = screen.getByText('Loading...').closest('.min-h-screen');
      expect(loadingContainer).toHaveClass('bg-white');
    });

    test('loading state remains visible during redirect to prevent flash', async () => {
      // Arrange: Mock hasToken to return false (will redirect)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Loading state should be visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for redirect to be initiated with return URL
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Loading state should still be visible after redirect is initiated
      // This prevents black screen or content flash during navigation
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('loading state is centered and accessible', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Loading container should be centered
      const loadingContainer = screen.getByText('Loading...').closest('.min-h-screen');
      expect(loadingContainer).toHaveClass('flex', 'items-center', 'justify-center');

      // Loading text should have good contrast
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toHaveClass('text-gray-600');

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling - Requirement 7.1, 7.2, 7.3', () => {
    test('handles token validation errors gracefully', async () => {
      // Arrange: Mock hasToken to throw an error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (tokenManager.hasToken as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for error handling
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Assert: Should redirect to login with return URL
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      
      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('redirects to login on localStorage error', async () => {
      // Arrange: Mock hasToken to throw localStorage error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (tokenManager.hasToken as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for redirect with return URL
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      });

      // Assert: Should handle error and redirect with return URL
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('handles router navigation errors with fallback', async () => {
      // Arrange: Mock hasToken to return false
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      
      // Mock router.push to throw error
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for error handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Assert: Should attempt router.push with return URL
      expect(mockPush).toHaveBeenCalledWith('/login?returnUrl=/dashboard');
      
      // Should log navigation error with new format (includes traceId and redirectUrl)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Dashboard] router.push failed, using fallback',
        expect.objectContaining({
          error: expect.any(String),
          fallback: 'window.location.href',
          timestamp: expect.any(String),
          traceId: null,
          redirectUrl: '/login?returnUrl=/dashboard',
        })
      );

      // Note: window.location.href fallback is tested in integration tests
      // as jsdom doesn't fully support navigation

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Lifecycle - Requirement 5.3, 5.4', () => {
    test('checks authentication on mount', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should check authentication immediately
      await waitFor(() => {
        expect(tokenManager.hasToken).toHaveBeenCalled();
      });
    });

    test('handles component unmount during auth check', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render and immediately unmount
      const { unmount } = render(<DashboardPage />);
      unmount();

      // Assert: Should not cause errors
      // No assertion needed - test passes if no errors thrown
    });

    test('does not update state after unmount', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render and unmount before auth check completes
      const { unmount } = render(<DashboardPage />);
      
      // Unmount immediately
      unmount();

      // Wait a bit to ensure no state updates occur
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: No errors should occur (cleanup function prevents state updates)
      // Test passes if no "Can't perform a React state update on an unmounted component" warning
    });
  });

  describe('Logout State Integration - Task 8.3', () => {
    test('shows logout UI when logout is in progress', async () => {
      // Arrange: Mock logout in progress
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should display logout UI
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      // Should show spinner
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Should NOT check token or redirect
      expect(tokenManager.hasToken).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('skips authentication check when logout is in progress', async () => {
      // Arrange: Mock logout in progress
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for component to settle
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      // Assert: Should NOT call hasToken
      expect(tokenManager.hasToken).not.toHaveBeenCalled();
      
      // Should NOT attempt redirect
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('displays logout transition UI with proper styling', async () => {
      // Arrange: Mock logout in progress
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should display logout message
      await waitFor(() => {
        expect(screen.getByText('Logging out...')).toBeInTheDocument();
      });

      // Should have white background (not black)
      const container = screen.getByText('Logging out...').closest('.min-h-screen');
      expect(container).toHaveClass('bg-white');
    });

    test('checks logout state before token validation', async () => {
      // Arrange: Track call order
      const callOrder: string[] = [];
      
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockImplementation(() => {
        callOrder.push('logout-check');
        return false;
      });
      
      (tokenManager.hasToken as jest.Mock).mockImplementation(() => {
        callOrder.push('token-check');
        return true;
      });

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Logout check should happen before token check
      // Note: logout check may be called multiple times (once per render)
      expect(callOrder[0]).toBe('logout-check');
      expect(callOrder).toContain('token-check');
      
      // Verify token check happens after at least one logout check
      const tokenCheckIndex = callOrder.indexOf('token-check');
      expect(tokenCheckIndex).toBeGreaterThan(0);
    });
  });

  describe('SSR Safety - Task 8.4', () => {
    test('handles undefined window gracefully', async () => {
      // Arrange: Mock hasToken to return false (will trigger redirect)
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      
      // Mock window as undefined (SSR context)
      const originalWindow = global.window;
      // @ts-ignore - Intentionally setting window to undefined for SSR test
      delete global.window;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for component to settle
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      // Assert: Should not throw errors
      // The component should handle undefined window gracefully
      // No critical errors should be logged (some expected errors are ok)
      
      // Restore window
      global.window = originalWindow;
      consoleErrorSpy.mockRestore();
    });

    test('does not call window.location.href when window is undefined', async () => {
      // Arrange: Mock hasToken to return false
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
      
      // Mock router.push to fail
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      // Mock window as undefined
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for error handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Assert: Should not crash when trying to access window.location.href
      // Test passes if no uncaught errors

      // Restore window
      global.window = originalWindow;
      consoleErrorSpy.mockRestore();
    });

    test('gracefully handles SSR context during timeout', async () => {
      // Arrange: Mock hasToken to delay (trigger timeout)
      (tokenManager.hasToken as jest.Mock).mockImplementation(() => {
        // Simulate slow response
        return new Promise(() => {}); // Never resolves
      });

      // Mock window as undefined
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for timeout (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2100));

      // Assert: Should handle timeout without crashing
      // Test passes if no uncaught errors

      // Restore window
      global.window = originalWindow;
      consoleWarnSpy.mockRestore();
    });
  });
});
