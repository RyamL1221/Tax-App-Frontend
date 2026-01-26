/**
 * Tests for useLogout hook
 * 
 * Covers:
 * - Initial state
 * - Loading state management
 * - Successful logout with redirect
 * - Network error handling
 * - Server error handling
 * - Error auto-clear after 3 seconds
 * - API request format
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useLogout } from './useLogout';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('useLogout', () => {
  // Mock fetch globally
  const mockFetch = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    mockPush.mockClear();
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
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValue(promise);
      
      const { result } = renderHook(() => useLogout());
      
      expect(result.current.isLoading).toBe(false);
      
      // Start logout
      act(() => {
        result.current.handleLogout();
      });
      
      // Should be loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      
      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          json: async () => ({ success: true }),
        });
      });
    });
  });
  
  describe('Successful Logout', () => {
    it('should send POST request to /api/auth/logout', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
    
    it('should redirect to /login on successful logout', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
    
    it('should keep loading state true until redirect on success', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      // Loading should still be true (until redirect completes)
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
    
    it('should not set error on successful logout', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBeNull();
    });
  });
  
  describe('Server Error Handling', () => {
    it('should display error message when server returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: {
            type: 'server',
            message: 'Failed to clear session',
          },
        }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to clear session');
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should use default error message if server error has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: {
            type: 'server',
          },
        }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
    });
    
    it('should use default error message if response has no error object', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
        }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Failed to log out. Please try again.');
    });
    
    it('should set loading to false after server error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: {
            type: 'server',
            message: 'Server error',
          },
        }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('Network Error Handling', () => {
    it('should display network error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe(
        'Failed to log out. Please check your connection and try again.'
      );
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should set loading to false after network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.isLoading).toBe(false);
    });
    
    it('should handle connection timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe(
        'Failed to log out. Please check your connection and try again.'
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
    
    it('should clear error after 3 seconds for server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: {
            type: 'server',
            message: 'Server error',
          },
        }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe('Server error');
      
      // Fast-forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.error).toBeNull();
    });
    
    it('should clear error after 3 seconds for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe(
        'Failed to log out. Please check your connection and try again.'
      );
      
      // Fast-forward time by 3 seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      
      expect(result.current.error).toBeNull();
    });
    
    it('should not clear error before 3 seconds', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe(
        'Failed to log out. Please check your connection and try again.'
      );
      
      // Fast-forward time by 2 seconds (less than 3)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      
      // Error should still be present
      expect(result.current.error).toBe(
        'Failed to log out. Please check your connection and try again.'
      );
    });
  });
  
  describe('Error State Clearing', () => {
    it('should clear previous error when new logout is initiated', async () => {
      // First logout - fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(result.current.error).toBe(
        'Failed to log out. Please check your connection and try again.'
      );
      
      // Second logout - succeeds
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
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
      // First attempt - success
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      
      const { result } = renderHook(() => useLogout());
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Second attempt - should also work
      mockFetch.mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });
      
      await act(async () => {
        await result.current.handleLogout();
      });
      
      expect(mockPush).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
