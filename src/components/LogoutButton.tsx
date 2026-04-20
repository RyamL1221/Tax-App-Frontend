'use client';

import React from 'react';
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
 * Logout is an instant client-side operation that clears the JWT token and redirects
 * via a hard navigation (window.location.href) to guarantee a clean page load.
 * 
 * Features:
 * - Uses "outline" variant for visual distinction
 * - Shows "Log Out" text
 * - Instant logout with no loading state (client-side only)
 * - Hard navigation ensures redirect always completes
 * - Accessible via keyboard (Tab, Enter, Space)
 * - Includes ARIA label for screen readers
 */
export function LogoutButton({ className }: LogoutButtonProps): JSX.Element {
  const handleLogout = () => {
    // Set logout state FIRST, before any other operations
    logoutStateManager.setLogoutInProgress();
    
    // Clear the JWT token
    authService.logout();

    // Clear logout state before hard navigation so the login page
    // doesn't see stale "in-progress" state in sessionStorage
    logoutStateManager.clearLogoutState();

    console.log('Logout successful');

    // Use hard navigation — soft navigation (router.push) is unreliable
    // after auth state changes and can leave the UI stuck
    window.location.href = '/login';
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
