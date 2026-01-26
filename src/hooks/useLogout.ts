'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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
 * - API request to /api/auth/logout
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
   * Sends POST request to /api/auth/logout endpoint.
   * On success: redirects to /login page
   * On error: displays error message for 3 seconds then clears it
   * 
   * Requirements:
   * - 3.1: Sends POST request to logout API
   * - 3.2: Displays loading state during request
   * - 3.3: Redirects to /login on success
   * - 5.1: Displays network error messages
   * - 5.2: Displays server error messages
   * - 5.3: Re-enables button after error
   * - 5.4: Auto-clears error after 3 seconds
   */
  const handleLogout = useCallback(async () => {
    // Clear any previous errors and set loading state
    setError(null);
    setIsLoading(true);
    
    try {
      // Send POST request to logout API
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Parse response
      const result = await response.json();
      
      if (result.success) {
        // Success - redirect to login page
        // Keep loading state true until redirect completes
        router.push('/login');
      } else {
        // Server returned error response
        setIsLoading(false);
        const errorMessage = result.error?.message || 'Failed to log out. Please try again.';
        setError(errorMessage);
        
        // Auto-clear error after 3 seconds
        setTimeout(() => {
          setError(null);
        }, 3000);
      }
    } catch (err) {
      // Network error or other exception
      setIsLoading(false);
      const errorMessage = 'Failed to log out. Please check your connection and try again.';
      setError(errorMessage);
      
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
