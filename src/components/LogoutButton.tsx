'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { authService } from '@/lib/api';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

/**
 * Props for the LogoutButton component
 */
export interface LogoutButtonProps {
  /**
   * Optional additional CSS classes for styling
   */
  className?: string;
}

/**
 * LogoutButton component that triggers the logout process
 * 
 * Displays a button that allows authenticated users to log out of their session.
 * Logout is an instant client-side operation that clears the JWT token and redirects.
 * 
 * Features:
 * - Uses "outline" variant for visual distinction
 * - Shows "Log Out" text
 * - Instant logout with no loading state (client-side only)
 * - Accessible via keyboard (Tab, Enter, Space)
 * - Includes ARIA label for screen readers
 * 
 * Requirements:
 * - 2.1: Displayed in CardHeader area of Dashboard
 * - 2.3: Uses existing Button component
 * - 2.4: Uses "outline" variant
 * - 2.5: Displays "Log Out" text
 * - 4.1: Clears JWT token from localStorage
 * - 4.2: Redirects to login page immediately
 * - 4.3: No API calls made (client-side only)
 * - 4.5: Token completely removed from storage
 * - 6.1: Has appropriate ARIA label
 * 
 * @example
 * ```tsx
 * <LogoutButton />
 * ```
 * 
 * @example
 * ```tsx
 * <LogoutButton className="ml-auto" />
 * ```
 */
export function LogoutButton({ className }: LogoutButtonProps): JSX.Element {
  const router = useRouter();
  
  /**
   * Handle logout process
   * 
   * Sets logout state, clears JWT token from localStorage, and redirects to login page.
   * This is a synchronous, client-side only operation with no API calls.
   * 
   * Requirements:
   * - 2.1: Sets logout state before any auth operations
   * - 2.5: Ensures state is set before token clearing
   * - 4.1: Calls authService.logout() to clear token
   * - 4.2: Redirects to /login immediately
   * - 4.3: No API calls made
   * - 4.5: Token completely removed from localStorage
   */
  const handleLogout = () => {
    // Set logout state FIRST, before any other operations
    // This prevents race conditions where components try to access auth state
    // after tokens are cleared but before redirect completes
    logoutStateManager.setLogoutInProgress();
    
    authService.logout();
    router.push('/login');
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      aria-label="Log out of your account"
      className={className}
    >
      Log Out
    </Button>
  );
}

export default LogoutButton;
