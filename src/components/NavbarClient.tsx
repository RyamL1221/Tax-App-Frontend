'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthState } from '@/lib/auth/AuthCoordinator';
import { LogoutButton } from '@/components/LogoutButton';

/**
 * NavbarClient component that renders navigation links based on JWT authentication state
 * 
 * This client component displays different navigation options depending on whether
 * the user is authenticated (has a JWT token) or not. It uses AuthCoordinator to
 * check for JWT token presence and displays appropriate navigation options.
 * 
 * Features:
 * - Always displays Home link
 * - Shows Login and Register links for unauthenticated users (no JWT token)
 * - Shows Dashboard link and LogoutButton for authenticated users (JWT token present)
 * - Uses AuthCoordinator for unified authentication state management
 * - Handles loading state to prevent flash of wrong content
 * - Uses Next.js Link component for client-side navigation
 * - Keyboard accessible navigation
 * 
 * Requirements:
 * - 1.1: Use AuthCoordinator to determine authentication state
 * - 1.2: Prioritize JWT token presence over session state
 * - 1.3: Call AuthCoordinator.getAuthState() to retrieve unified authentication status
 * - 1.4: Handle authentication state asynchronously without blocking render
 * - 2.1: Display Login link when no JWT token is present
 * - 2.2: Display Register link when no JWT token is present
 * - 2.3: Do NOT display Dashboard link when no JWT token is present
 * - 3.1: Display Dashboard link when JWT token is present
 * - 3.2: Display LogoutButton when JWT token is present
 * - 3.3: Do NOT display Login link when JWT token is present
 * - 3.4: Do NOT display Register link when JWT token is present
 * - 4.1: Integrate LogoutButton component
 * - 4.2: LogoutButton clears JWT token on click
 * - 4.3: LogoutButton redirects to /login on click
 * - 5.1: Use client-side rendering for authentication-dependent UI
 * - 5.2: Update display immediately when authentication state changes
 * - 5.3: Maintain authentication state in React component state
 * - 5.4: Re-check authentication state when component mounts
 * - 7.1: Display Home link for both authenticated and unauthenticated users
 * 
 * @example
 * ```tsx
 * // Component manages its own authentication state
 * <NavbarClient />
 * ```
 */
export default function NavbarClient(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check authentication state using AuthCoordinator
   * 
   * This function calls AuthCoordinator.getAuthState() to determine if the user
   * is authenticated. It updates the component state based on the result.
   * 
   * Requirements: 1.1, 1.2, 1.3, 5.3
   */
  const checkAuthState = async () => {
    try {
      const authState = await getAuthState();
      console.log('[NavbarClient] Auth state received:', authState);
      
      // Use isAuthenticated to determine authentication status
      setIsAuthenticated(authState.isAuthenticated);
      setIsLoading(false);
    } catch (error) {
      // On error, default to unauthenticated state
      console.error('[NavbarClient] Error checking auth state:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  /**
   * Check authentication state on component mount
   * 
   * Requirements: 5.4
   */
  useEffect(() => {
    checkAuthState();
  }, []);

  // Show minimal UI while loading to prevent flash of wrong content
  // Requirements: 1.4
  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center flex-shrink-0">
              <Link 
                href="/" 
                className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
              >
                Home
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Loading state - show minimal UI */}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand and Home Link */}
          {/* Requirements: 7.1 - Home link always visible */}
          <div className="flex items-center flex-shrink-0">
            <Link 
              href="/" 
              className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Unauthenticated Section - Requirements: 2.1, 2.2, 2.3 */}
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200 font-medium"
                >
                  Register
                </Link>
              </>
            )}

            {/* Authenticated Section - Requirements: 3.1, 3.2, 3.3, 3.4, 4.1 */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
