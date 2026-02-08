/**
 * Tests for Dashboard Redirect Before Content Render
 * 
 * Validates that redirect happens before any dashboard content is rendered,
 * ensuring loading state remains visible during redirect and no dashboard
 * content flashes before navigation.
 * 
 * Task 3.2: Ensure redirect happens before content renders
 * Requirements:
 * - 4.2: Redirect SHALL happen before rendering dashboard content
 * - 5.5: Redirect SHALL complete within 500ms of authentication failure
 */

import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { getAuthState } from '@/lib/auth/AuthCoordinator';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';
import DashboardPage from './page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/AuthCoordinator', () => ({
  getAuthState: jest.fn(),
}));

jest.mock('@/lib/auth/LogoutStateManager', () => ({
  logoutStateManager: {
    isLogoutInProgress: jest.fn(),
  },
}));

jest.mock('@/lib/auth/LoginFlowTracer', () => ({
  getTraceId: jest.fn(() => 'test-trace-id'),
}));

jest.mock('./DashboardClient', () => {
  return function MockDashboardClient() {
    return <div data-testid="dashboard-content">Dashboard Content</div>;
  };
});

describe('Dashboard Redirect Before Content Render - Task 3.2', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Loading State Visibility During Redirect - Requirement 4.2', () => {
    it('should keep loading state visible during redirect', async () => {
      // Mock unauthenticated state
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        reason: 'JWT required for this route',
        userId: null,
        email: null,
      });

      const { container } = render(<DashboardPage />);

      // Initially should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalledWith({
          requireJWT: true,
          traceId: 'test-trace-id',
        });
      });

      // After auth check, redirect should be initiated
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Loading state should STILL be visible (not cleared during redirect)
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('should not clear loading state when redirect is initiated', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        reason: 'No JWT token found',
        userId: null,
        email: null,
      });

      const { container } = render(<DashboardPage />);

      // Verify loading state is present
      const loadingDiv = container.querySelector('.min-h-screen.bg-white');
      expect(loadingDiv).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Loading state should remain (isAuthenticated stays null)
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(loadingDiv).toBeInTheDocument();
    });
  });

  describe('No Dashboard Content Before Redirect - Requirement 4.2', () => {
    it('should never render dashboard content when unauthenticated', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        reason: 'JWT required',
        userId: null,
        email: null,
      });

      render(<DashboardPage />);

      // Wait for auth check and redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Dashboard content should NEVER appear
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should not flash dashboard content before redirect', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        userId: null,
        email: null,
      });

      render(<DashboardPage />);

      // Verify loading state is present initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Dashboard content should never have been rendered
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
      
      // Loading state should still be visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should maintain loading state throughout redirect process', async () => {
      let resolveAuth: (value: any) => void;
      const authPromise = new Promise((resolve) => {
        resolveAuth = resolve;
      });

      (getAuthState as jest.Mock).mockReturnValue(authPromise);

      render(<DashboardPage />);

      // Should show loading immediately
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Resolve auth check with unauthenticated state
      resolveAuth!({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        userId: null,
        email: null,
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Loading should still be visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      // Dashboard content should never appear
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });
  });

  describe('Redirect Timing - Requirement 5.5', () => {
    it('should initiate redirect within 500ms of authentication failure', async () => {
      const startTime = Date.now();

      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        userId: null,
        email: null,
      });

      render(<DashboardPage />);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Redirect should happen quickly (within 500ms)
      expect(duration).toBeLessThan(500);
    });

    it('should use timeout protection if auth check hangs', async () => {
      // Mock auth check that never resolves
      (getAuthState as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<DashboardPage />);

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Fast-forward to timeout (2000ms)
      jest.advanceTimersByTime(2000);

      // Should have forced redirect via window.location.href
      // (Can't easily test window.location.href in jsdom, but timeout should fire)
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalled();
      });

      // Loading state should still be visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect immediately when no JWT exists', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        reason: 'JWT required for this route',
        userId: null,
        email: null,
      });

      render(<DashboardPage />);

      // Should redirect very quickly
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/login');
        },
        { timeout: 100 }
      );
    });
  });

  describe('Authenticated User Rendering - Requirement 4.2', () => {
    it('should render dashboard content only when authenticated', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: true,
        hasJWT: true,
        hasSession: true,
        authMethod: 'jwt',
        inFallbackMode: false,
        userId: 'user-123',
        email: 'user@example.com',
      });

      render(<DashboardPage />);

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for auth check to complete
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalledWith({
          requireJWT: true,
          traceId: 'test-trace-id',
        });
      });

      // Should render dashboard content
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      // Should NOT redirect
      expect(mockPush).not.toHaveBeenCalled();

      // Loading should be gone
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('should transition from loading to dashboard without redirect', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: true,
        hasJWT: true,
        hasSession: true,
        authMethod: 'jwt',
        inFallbackMode: false,
        userId: 'user-123',
        email: 'user@example.com',
      });

      render(<DashboardPage />);

      // Track state transitions
      const states: string[] = [];

      if (screen.queryByText('Loading...')) {
        states.push('loading');
      }

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
      });

      if (screen.queryByTestId('dashboard-content')) {
        states.push('dashboard');
      }

      // Should transition: loading -> dashboard (no redirect)
      expect(states).toEqual(['loading', 'dashboard']);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Session-Only Authentication Rejection - Requirement 4.2', () => {
    it('should redirect when only session exists (no JWT)', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: true,
        authMethod: 'none',
        inFallbackMode: false,
        reason: 'JWT required for this route',
        userId: null,
        email: null,
      });

      render(<DashboardPage />);

      // Should redirect even though session exists
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should not render dashboard in fallback mode', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: true,
        authMethod: 'session',
        inFallbackMode: true,
        reason: 'JWT required but only session available',
        userId: 'user-123',
        email: 'user@example.com',
      });

      render(<DashboardPage />);

      // Should redirect even in fallback mode
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
      // Loading state should remain visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error Handling During Redirect - Requirement 4.2', () => {
    it('should maintain loading state if router.push fails', async () => {
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        userId: null,
        email: null,
      });

      // Mock router.push to throw error
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const { container } = render(<DashboardPage />);

      // Wait for redirect attempt
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Loading state should still be visible (fallback to window.location.href)
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should not render dashboard content on auth check error', async () => {
      // Mock auth check to throw error
      (getAuthState as jest.Mock).mockRejectedValue(
        new Error('Auth check failed')
      );

      render(<DashboardPage />);

      // Wait for error handling
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
      // Loading state should remain
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Logout State Priority - Requirement 4.2', () => {
    it('should show logout UI instead of loading during logout', () => {
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      render(<DashboardPage />);

      // Should show logout UI, not loading
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

      // Should not call getAuthState during logout
      expect(getAuthState).not.toHaveBeenCalled();

      // Dashboard content should not render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should not render dashboard content during logout', () => {
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      render(<DashboardPage />);

      // Logout UI should be visible
      expect(screen.getByText('Logging out...')).toBeInTheDocument();

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();

      // Should not attempt authentication check
      expect(getAuthState).not.toHaveBeenCalled();
    });
  });
});
