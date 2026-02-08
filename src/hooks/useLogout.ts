'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/lib/auth/AuthCoordinator';
import { logAuthEvent, createAuthState } from '@/lib/auth/AuthLogger';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

/**
 * Return type for the useLogout hook
 */
export interface UseLogoutReturn {
  /**
   * Whether the logout request is currently in progress
   */
  isLoading: boolean;
  
  /**
   * Error message if logout fails, null otherwise
   */
  error: string | null;
  
  /**
   * Async function to initiate the logout process
   */
  handleLogout: () => Promise<void>;
}

/**
 * Custom hook for managing logout state and API communication
 * 
 * Handles the complete logout flow including:
 * - Loading state management
 * - Clearing both JWT token and session via AuthCoordinator
 * - Calling server-side logout API to clear session cookie
 * - Success handling with redirect to /login
 * - Error handling with user-friendly messages
 * - Auto-clearing errors after 3 seconds
 * - Comprehensive logging for debugging
 * 
 * @returns Object containing logout state and handler function
 * 
 * @example
 * ```tsx
 * const { isLoading, error, handleLogout } = useLogout();
 * 
 * return (
 *   <div>
 *     <button onClick={handleLogout} disabled={isLoading}>
 *       {isLoading ? 'Logging out...' : 'Log Out'}
 *     </button>
 *     {error && <p>{error}</p>}
 *   </div>
 * );
 * ```
 */
export function useLogout(): UseLogoutReturn {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Handle logout process
   * 
   * Uses AuthCoordinator to clear both JWT token and session cookie,
   * ensuring both authentication mechanisms are synchronized.
   * 
   * Requirements:
   * - 3.5 (debug-form-logout-issue): Uses AuthCoordinator.clearAuth() to clear both session and JWT
   * - Calls /api/auth/logout to clear server-side session
   * - Redirects to /login on success
   * - Displays loading state during process
   * - Adds logging for logout auth clearing
   */
  const handleLogout = useCallback(async () => {
    // Clear any previous errors and set loading state
    setError(null);
    setIsLoading(true);
    
    // Set logout state FIRST, before any other operations
    // This signals to all components that logout is in progress
    // Requirements: 2.1, 2.5
    logoutStateManager.setLogoutInProgress();
    
    logAuthEvent(
      'Logout initiated',
      'info',
      createAuthState(true, true, null, null),
      {
        operation: 'logout',
        source: 'useLogout',
        logoutInProgress: true,
      }
    );
    
    try {
      // Call server-side logout API to clear session cookie
      // This must happen before clearing client-side JWT to ensure proper coordination
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear session');
      }
      
      // Clear both JWT token and session using AuthCoordinator
      // This ensures both authentication mechanisms are synchronized
      // Requirements: 3.5 (debug-form-logout-issue)
      clearAuth('user-logout');
      
      logAuthEvent(
        'Logout completed successfully',
        'info',
        createAuthState(false, false, null, null),
        {
          operation: 'logout',
          source: 'useLogout',
          sessionCleared: true,
          jwtCleared: true,
        }
      );
      
      // Success - redirect to login page
      // Keep loading state true until redirect completes
      router.push('/login');
    } catch (err) {
      // Clear logout state on error to allow retry
      // Requirements: 2.4
      logoutStateManager.clearLogoutState();
      
      // Handle errors gracefully
      setIsLoading(false);
      const errorMessage = 'Failed to log out. Please try again.';
      setError(errorMessage);
      
      logAuthEvent(
        'Logout failed',
        'error',
        createAuthState(false, false, null, null),
        {
          operation: 'logout',
          source: 'useLogout',
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      );
      
      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  }, [router]);
  
  return {
    isLoading,
    error,
    handleLogout,
  };
}

export default useLogout;
