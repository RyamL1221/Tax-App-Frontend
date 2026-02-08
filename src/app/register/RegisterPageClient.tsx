'use client';

import React, { useEffect, useState } from 'react';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  /**
   * Check if user is already authenticated
   * If so, redirect to dashboard
   * Requirements: 10.4
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await getAuthState();
        console.log('[RegisterPageClient] Auth state:', authState);
        
        // If user has JWT token, redirect to dashboard
        if (authState.hasJWT) {
          console.log('[RegisterPageClient] User already authenticated, redirecting to dashboard');
          const targetUrl = callbackUrl || '/dashboard';
          router.push(targetUrl);
          return;
        }
        
        // User not authenticated, show register form
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('[RegisterPageClient] Error checking auth state:', error);
        // On error, assume not authenticated and show register form
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, callbackUrl]);

  /**
   * Handle successful registration
   * Requirements 6.3, 10.2: Redirect user to dashboard or callback URL
   */
  const handleSuccess = () => {
    const targetUrl = callbackUrl || '/dashboard';
    router.push(targetUrl);
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

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
