/**
 * Tests for useLogout hook
 * 
 * Covers:
 * - Initial state
 * - Loading state management
 * - Successful logout with redirect
 * - Error handling (API failures)
 * - Error auto-clear after 3 seconds
 * - AuthCoordinator integration for clearing both session and JWT
 * - Server-side session clearing via API route
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useLogout } from './useLogout';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthCoordinator
jest.mock('@/lib/auth/AuthCoordinator', () => ({
  clearAuth: jest.fn(),
}));

// Mock AuthLogger
jest.mock('@/lib/auth/AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  createAuthState: jest.fn((hasSession, hasJWT, userId, email) => ({
    hasSession,
    hasJWT,
    isAuthenticated: hasSession && hasJWT,
    userId,
    email,
  })),
}));

// Import mocked functions
import { clearAuth } from '@/lib/auth/AuthCoordinator';
import { logAuthEvent } from '@/lib/auth/AuthLogger';

describe('useLogout', () => {
  const mockPush = jest.fn();
  const mockClearAuth = clearAuth as jest.Mock;
  const mockLogAuthEvent = logAuthEvent as jest.Mock;
  
  beforeEach(() => {
    mockPush.mockClear();
    mockClearAuth.mockClear();
    mockLogAuthEvent.mockClear();
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock fetch for logout API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)
    );
    
    // Clear all timers
    jest.clearAllTimers();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Initial State', () => {
    it('should initialize with not loading and no error', () => {
      const { result } = renderHook(() => useLogout());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    it('should provide handleLogout function', () => {
      const { result } = renderHook(() => useLogout());
      
      expect(result.current.handleLogout).toBeDefined();
      expect(typeof result.current.handleLogout).toBe('function');
    });
  });
  
  describe('Loading State Management', () => {
    it('should set loading state to true when logout is initiated', async () => {
      const { result } = renderHook(() => useLogout());
      
      expect(result.current.isLoading).toBe(false);
      
      // Start logout
      await act(async () => {
        await result.current.handleLogout();
      });
      
      // Should be loading (stays true until redirect completes)
      expect(result.current.isLoading).toBe(true);
    });
  });
  
  describe('Successful Logout', () => {
    it('should call logout API to clear server-side session', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
    
    it('should call AuthCoordinator.clearAuth() to clear both session and JWT', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockClearAuth).toHaveBeenCalledWith('user-logout');
    });
    
    it('should redirect to /login on successful logout', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    
    it('should keep loading state true until redirect on success', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      // Loading should still be true (until redirect completes)
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
    
    it('should not set error on successful logout', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBeNull();
    });
    
    it('should log logout initiation', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockLogAuthEvent).toHaveBeenCalledWith(
        'Logout initiated',
        'info',
        expect.any(Object),
        expect.objectContaining({
          operation: 'logout',
          source: 'useLogout',
        })
      );
    });
    
    it('should log successful logout completion', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockLogAuthEvent).toHaveBeenCalledWith(
        'Logout completed successfully',
        'info',
        expect.any(Object),
        expect.objectContaining({
          operation: 'logout',
          source: 'useLogout',
          sessionCleared: true,
          jwtCleared: true,
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      // Mock fetch to fail
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ success: false }),
        } as Response)
      );
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should set loading to false after error', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should log logout failure', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockLogAuthEvent).toHaveBeenCalledWith(
        'Logout failed',
        'error',
        expect.any(Object),
        expect.objectContaining({
          operation: 'logout',
          source: 'useLogout',
          error: 'Network error',
        })
      );
    });
  });
  
  describe('Error Auto-Clear', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should clear error after 3 seconds', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
      
      // Fast-forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.error).toBeNull();
    });
    
    it('should not clear error before 3 seconds', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
      
      // Fast-forward time by 2 seconds (less than 3)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // Error should still be present
      expect(result.current.error).toBe('Failed to log out. Please try again.');
    });
  });
  
  describe('Error State Clearing', () => {
    it('should clear previous error when new logout is initiated', async () => {
      // First logout - fails
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
      
      // Second logout - succeeds
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      // Error should be cleared before the new logout attempt
      expect(result.current.error).toBeNull();
    });
  });
  
  describe('Multiple Logout Attempts', () => {
    it('should handle multiple logout attempts correctly', async () => {
      const { result } = renderHook(() => useLogout());
      
      // First attempt - success
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      
      // Second attempt - should also work
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledTimes(2);
      expect(mockClearAuth).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('AuthCoordinator Integration', () => {
    it('should clear auth after successful API call', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      // Verify API was called first
      expect(global.fetch).toHaveBeenCalled();
      
      // Then AuthCoordinator.clearAuth was called
      expect(mockClearAuth).toHaveBeenCalledWith('user-logout');
    });
    
    it('should not clear auth if API call fails', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      // AuthCoordinator.clearAuth should not be called if API fails
      expect(mockClearAuth).not.toHaveBeenCalled();
    });
  });
});
