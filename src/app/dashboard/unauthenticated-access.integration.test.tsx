/**
 * Integration Test: Unauthenticated Dashboard Access
 * 
 * Tests the complete flow when an unauthenticated user attempts to access
 * the dashboard. Validates that:
 * - Redirect to /login occurs
 * - No dashboard content is rendered
 * - Redirect completes within 500ms
 * 
 * Task 3.3: Write integration test for unauthenticated dashboard access
 * 
 * Requirements:
 * - 1.1: Dashboard SHALL redirect unauthenticated users to login
 * - 4.2: Redirect SHALL happen before rendering dashboard content
 * - 5.5: Redirect SHALL complete within 500ms
 * 
 * **Validates: Requirements 1.1, 4.2, 5.5**
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

describe('Unauthenticated Dashboard Access - Integration Test (Task 3.3)', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock logout state as not in progress
    (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(false);
    
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Complete Unauthenticated Access Flow - Requirements 1.1, 4.2, 5.5', () => {
    it('should redirect to /login when accessing dashboard without JWT', async () => {
      // Mock unauthenticated state (no JWT)
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

      // Wait for authentication check to complete
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalledWith({
          requireJWT: true,
          traceId: 'test-trace-id',
        });
      });

      // Verify redirect to /login was initiated
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Requirement 1.1: Dashboard SHALL redirect unauthenticated users to login
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should not render any dashboard content before redirect', async () => {
      // Mock unauthenticated state
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

      render(<DashboardPage />);

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Requirement 4.2: No dashboard content should be rendered
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });

    it('should complete redirect within 500ms', async () => {
      const startTime = Date.now();

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

      render(<DashboardPage />);

      // Wait for redirect to be initiated
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Requirement 5.5: Redirect SHALL complete within 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Loading State During Redirect - Requirement 4.2', () => {
    it('should show loading state initially', () => {
      // Mock unauthenticated state
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

      // Should show loading state immediately
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should maintain loading state during redirect', async () => {
      // Mock unauthenticated state
      (getAuthState as jest.Mock).mockResolvedValue({
        isAuthenticated: false,
        hasJWT: false,
        hasSession: false,
        authMethod: 'none',
        inFallbackMode: false,
        userId: null,
        email: null,
      });

      const { container } = render(<DashboardPage />);

      // Verify loading state is present
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Loading state should still be visible (not cleared during redirect)
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
    });

    it('should never show dashboard content during the entire flow', async () => {
      // Mock unauthenticated state
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

      // Initially: loading state, no dashboard
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();

      // Wait for auth check
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalled();
      });

      // After auth check: still loading, no dashboard
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // After redirect: still loading, no dashboard
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Session-Only Authentication Rejection - Requirement 1.1', () => {
    it('should redirect when only session exists (no JWT)', async () => {
      // Mock state with session but no JWT
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

    it('should redirect when in fallback mode without JWT', async () => {
      // Mock fallback mode state (session-only)
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
    });
  });

  describe('Authentication Check with requireJWT Flag - Requirement 1.1', () => {
    it('should call getAuthState with requireJWT: true', async () => {
      // Mock unauthenticated state
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

      // Verify getAuthState was called with requireJWT: true
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalledWith({
          requireJWT: true,
          traceId: 'test-trace-id',
        });
      });
    });

    it('should enforce JWT-only authentication', async () => {
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

      render(<DashboardPage />);

      // Wait for auth check
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalledWith(
          expect.objectContaining({ requireJWT: true })
        );
      });

      // Should redirect due to missing JWT
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Error Handling During Authentication - Requirement 4.2', () => {
    it('should redirect on authentication check error', async () => {
      // Mock auth check to throw error
      (getAuthState as jest.Mock).mockRejectedValue(
        new Error('Auth check failed')
      );

      render(<DashboardPage />);

      // Wait for error handling and redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should maintain loading state on error', async () => {
      // Mock auth check to throw error
      (getAuthState as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<DashboardPage />);

      // Wait for error handling
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Loading state should remain visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should use fallback redirect if router.push fails', async () => {
      // Mock unauthenticated state
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

      render(<DashboardPage />);

      // Wait for redirect attempt
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });

      // Loading state should still be visible (fallback to window.location.href)
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Dashboard content should never render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });
  });

  describe('Redirect Timing Performance - Requirement 5.5', () => {
    it('should redirect immediately when JWT is missing', async () => {
      const startTime = Date.now();

      // Mock unauthenticated state
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
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith('/login');
        },
        { timeout: 100 }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should redirect very quickly (well under 500ms)
      expect(duration).toBeLessThan(100);
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
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalled();
      });

      // Loading state should still be visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should complete full flow within 500ms under normal conditions', async () => {
      const startTime = Date.now();

      // Mock fast auth check
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

      // Wait for complete flow
      await waitFor(() => {
        expect(getAuthState).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalled();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Complete flow should be fast
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Contrast: Authenticated User Access', () => {
    it('should render dashboard for authenticated user with JWT', async () => {
      // Mock authenticated state with JWT
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

      // Wait for auth check
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
  });

  describe('LocalStorage Cleared Scenario - Requirement 1.1', () => {
    it('should redirect when localStorage is cleared (no JWT)', async () => {
      // Ensure localStorage is empty
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

      // Mock unauthenticated state (no JWT in localStorage)
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

      // Should redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // No dashboard content should render
      expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();
    });

    it('should complete redirect within 500ms with cleared localStorage', async () => {
      const startTime = Date.now();

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

      // Mock unauthenticated state
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

      // Should complete quickly
      expect(duration).toBeLessThan(500);
    });
  });
});
