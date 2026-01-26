'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useLogout } from '@/hooks/useLogout';

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
 * The button shows loading state during logout and handles errors gracefully.
 * 
 * Features:
 * - Uses "outline" variant for visual distinction
 * - Shows "Log Out" text in normal state
 * - Shows "Logging out..." text during logout
 * - Disabled during logout process
 * - Accessible via keyboard (Tab, Enter, Space)
 * - Includes ARIA label for screen readers
 * 
 * Requirements:
 * - 2.1: Displayed in CardHeader area of Dashboard
 * - 2.3: Uses existing Button component
 * - 2.4: Uses "outline" variant
 * - 2.5: Displays "Log Out" text
 * - 3.2: Shows loading state during logout
 * - 4.1: Becomes disabled when clicked
 * - 4.2: Displays "Logging out..." during logout
 * - 4.3: Shows loading indicator
 * - 4.4: Remains disabled until redirect
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
  const { isLoading, error, handleLogout } = useLogout();
  
  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={handleLogout}
        loading={isLoading}
        loadingText="Logging out..."
        aria-label="Log out of your account"
      >
        Log Out
      </Button>
      {error && (
        <p 
          className="text-red-600 text-sm mt-2" 
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default LogoutButton;
