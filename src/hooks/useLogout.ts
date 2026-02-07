'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';

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
 * - Token clearing via authService
 * - Success handling with redirect to /login
 * - Error handling with user-friendly messages
 * - Auto-clearing errors after 3 seconds
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
   * Clears JWT token from localStorage via authService.
   * On success: redirects to /login page
   * On error: displays error message for 3 seconds then clears it
   * 
   * Requirements:
   * - 3.1: Calls authService.logout() to clear token
   * - 3.2: Token is removed from localStorage
   * - 3.3: Redirects to /login on success
   * - 3.4: Displays loading state during process
   * - 3.5: Clears token even if error occurs
   */
  const handleLogout = useCallback(async () => {
    // Clear any previous errors and set loading state
    setError(null);
    setIsLoading(true);
    
    try {
      // Clear JWT token from localStorage (synchronous operation)
      authService.logout();
      
      // Success - redirect to login page
      // Keep loading state true until redirect completes
      router.push('/login');
    } catch (err) {
      // This should rarely happen since logout is synchronous
      // But we handle it gracefully just in case
      setIsLoading(false);
      setError('Failed to log out. Please try again.');
      
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
