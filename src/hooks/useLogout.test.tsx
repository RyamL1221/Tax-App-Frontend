/**
 * Tests for useLogout hook
 * 
 * Covers:
 * - Initial state
 * - Loading state management
 * - Successful logout with redirect
 * - Error handling (rare cases)
 * - Error auto-clear after 3 seconds
 * - Token clearing via authService
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useLogout } from './useLogout';
import { authService } from '@/lib/api';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock authService
jest.mock('@/lib/api', () => ({
  authService: {
    logout: jest.fn(),
  },
}));

describe('useLogout', () => {
  const mockPush = jest.fn();
  const mockLogout = authService.logout as jest.Mock;
  
  beforeEach(() => {
    mockPush.mockClear();
    mockLogout.mockClear();
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
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
    it('should call authService.logout()', async () => {
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
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
  });
  
  describe('Error Handling', () => {
    it('should display error message when logout throws an error', async () => {
      // Mock authService.logout to throw an error (rare case)
      mockLogout.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should set loading to false after error', async () => {
      mockLogout.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.isLoading).toBe(false);
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
      mockLogout.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
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
      mockLogout.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
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
      mockLogout.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
      
      // Second logout - succeeds
      mockLogout.mockImplementationOnce(() => {
        // Success - no error
      });
      
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
      expect(mockLogout).toHaveBeenCalledTimes(1);
      
      // Second attempt - should also work
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledTimes(2);
      expect(mockLogout).toHaveBeenCalledTimes(2);
    });
  });
});
