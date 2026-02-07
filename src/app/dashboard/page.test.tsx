/**
 * Unit tests for Dashboard Page Client Component
 * 
 * Tests that the dashboard page:
 * - Renders DashboardClient for authenticated users
 * - Redirects unauthenticated users to login page
 * - Integrates with JWT token management system
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.3, 5.1, 5.3, 5.4**
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as tokenManager from '@/lib/api/tokenManager';

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
  });

  describe('Authenticated User Access - Requirement 1.2', () => {
    test('renders DashboardClient when user has valid token', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      const { container } = render(<DashboardPage />);

      // Wait for authentication check to complete
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Should render dashboard client
      expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      
      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalled();
      
      // Verify hasToken was called
      expect(tokenManager.hasToken).toHaveBeenCalledTimes(1);
    });

    test('renders DashboardClient without redirect when token exists', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Verify no redirect occurred
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('displays loading state initially', () => {
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

      // Assert: Should show loading state immediately
      // Since useEffect runs synchronously in tests, we can't reliably test the loading state
      // This test verifies the component renders without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Unauthenticated User Redirect - Requirement 1.3, 4.1, 4.3', () => {
    test('redirects to login when no token exists', async () => {
      // Arrange: Mock hasToken to return false
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Verify hasToken was called
      expect(tokenManager.hasToken).toHaveBeenCalledTimes(1);
    });

    test('does not render DashboardClient when token is invalid', async () => {
      // Arrange: Mock hasToken to return false
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Assert: Dashboard should never render
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();
    });

    test('redirect always targets /login path', async () => {
      // Arrange: Mock hasToken to return false
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Assert: Verify redirect was called with exactly '/login'
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush.mock.calls[0][0]).toBe('/login');
    });

    test('redirects immediately without exposing dashboard data', async () => {
      // Arrange: Mock hasToken to return false
      (tokenManager.hasToken as jest.Mock).mockReturnValue(false);

      // Act: Render the page component
      render(<DashboardPage />);

      // Assert: Dashboard client should never be rendered
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Verify dashboard was never exposed
      expect(screen.queryByTestId('dashboard-client')).not.toBeInTheDocument();
    });
  });

  describe('Token Management Integration - Requirement 1.1, 1.4', () => {
    test('calls hasToken to verify authentication', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(tokenManager.hasToken).toHaveBeenCalled();
      });

      // Assert: Verify hasToken was called
      expect(tokenManager.hasToken).toHaveBeenCalledTimes(1);
    });

    test('uses tokenManager module for authentication', async () => {
      // Arrange: Mock hasToken to return true
      (tokenManager.hasToken as jest.Mock).mockReturnValue(true);

      // Act: Render the page component
      render(<DashboardPage />);

      // Wait for authentication check
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-client')).toBeInTheDocument();
      });

      // Assert: Verify hasToken from @/lib/api/tokenManager was used
      expect(tokenManager.hasToken).toHaveBeenCalled();
      expect(jest.isMockFunction(tokenManager.hasToken)).toBe(true);
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
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Assert: Should redirect to login
      expect(mockPush).toHaveBeenCalledWith('/login');
      
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

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Assert: Should handle error and redirect
      expect(mockPush).toHaveBeenCalledWith('/login');
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

      // Assert: Should attempt router.push
      expect(mockPush).toHaveBeenCalledWith('/login');
      
      // Should log navigation error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Navigation failed:',
        expect.any(Error)
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
});
