'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RegistrationForm } from '@/components/RegistrationForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getAuthState } from '@/lib/auth/AuthCoordinator';

export interface RegisterPageClientProps {
  /**
   * URL to redirect to after successful registration
   */
  callbackUrl?: string;
}

/**
 * Client Component: Register Page
 * 
 * This component provides the registration user interface with:
 * - Card-based layout for the registration form
 * - Page title and description
 * - Responsive design (mobile and desktop)
 * - Error boundary for error handling
 * - Success redirect handling
 * - Authentication state checking (redirects if already logged in)
 * 
 * Requirements:
 * - 6.3: Redirect user after successful registration
 * - 10.2: Redirect to dashboard after successful registration
 * - 10.4: Redirect authenticated users to dashboard
 * 
 * @param props - Component props
 * @returns Register page UI
 */
export default function RegisterPageClient({ callbackUrl }: RegisterPageClientProps) {
  const router = useRouter();
  const mountedRef = useRef(true);

  /**
   * Check if user is already authenticated
   * If so, redirect to dashboard
   * 
   * Also listen for storage events to sync authentication state across tabs
   * Requirements: 10.4, 7.5 (jwt-only-authentication)
   */
  useEffect(() => {
    mountedRef.current = true;
    
    const checkAuth = async () => {
      try {
        const authState = await getAuthState();
        
        if (!mountedRef.current) return;
        
        console.log('[RegisterPageClient] Auth state:', authState);
        
        // If user is authenticated, redirect to dashboard
        if (authState.isAuthenticated) {
          console.log('[RegisterPageClient] User already authenticated, redirecting to dashboard');
          const targetUrl = callbackUrl || '/dashboard';
          router.push(targetUrl);
          return;
        }
      } catch (error) {
        console.error('[RegisterPageClient] Error checking auth state:', error);
        // On error, just show the register form (already visible)
      }
    };

    checkAuth();
    
    // Listen for storage events to sync across tabs
    // Requirements: 7.5 (jwt-only-authentication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token') {
        console.log('[RegisterPageClient] Token changed in another tab, re-checking auth');
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, callbackUrl]);

  /**
   * Handle successful registration
   * Requirements 6.3, 10.2: Redirect user to dashboard or callback URL
   */
  const handleSuccess = () => {
    const targetUrl = callbackUrl || '/dashboard';
    router.push(targetUrl);
  };

  return (
    <ErrorBoundary>
      {/* Main container with responsive layout */}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* 
          Responsive container:
          - Mobile (< 768px): Full width with padding
          - Tablet/Desktop (>= 768px): Fixed max width
        */}
        <div className="w-full max-w-md">
          <Card variant="elevated" className="shadow-xl">
            <CardHeader className="space-y-2 text-center pb-6">
              {/* Page Title */}
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Create your account
              </h1>
              
              {/* Page Description */}
              <p className="text-sm text-gray-600 sm:text-base">
                Sign up to get started with your tax preparation
              </p>
            </CardHeader>

            <CardContent className="pb-8">
              {/* Registration Form Component */}
              <RegistrationForm onSuccess={handleSuccess} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
